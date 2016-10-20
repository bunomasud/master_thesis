var express = require('express');
var mongoose = require('mongoose');
var async = require("async");
var fs = require('fs');
var _ = require('lodash');
var request = require('request');
var throttledRequest = require('throttled-request')(request)
var Grid = require('gridfs-stream');
var esprima = require('esprima');
var Readable = require('stream').Readable;
var chunkit = require('chunkit');
var Set = require("collections/set");
const md5Hex = require('md5-hex');
var Promise = require('promise');
var log4js = require('log4js');
var EventEmitter = require("events").EventEmitter;
var chunk = require('chunk');
var blocked = require('blocked');
var estraverse = require('estraverse');
var hash = require('json-hash');
var eshash = require('es-hash');

blocked(function (ms) {
    logger.debug(" Child Blocked" + ms);
});
//log4j configuration

var busyLoop = require('busy-loop');

busyLoop(function (amount) {
    logger.debug('Child Loop was busy for' + amount + 'ms');
});

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/child_downloader.log'), 'ChildDownloader');
var logger = log4js.getLogger('ChildDownloader');

var ObjectId = mongoose.Types.ObjectId;


//Adding next function to libnames Array
/*Array.prototype.next = function () {
 if (!((this.current + 1) in this)) return false;
 return this[++this.current];
 };
 Array.prototype.current = 0;*/

//This will throttle the requests so no more than 2 are made every second

throttledRequest.configure({
    requests: 10,
    milliseconds: 1000
});

//adding mongoose to grid
Grid.mongo = mongoose.mongo;
// Create the application.
var app = express();

//adding task queue


app.use(log4js.connectLogger(logger, {level: 'auto'}));

app.models = require('./models/models');
// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27018/DBtest102');


//event
var ee = new EventEmitter();
ee.on("someEvent1", function (data) {
    logger.info("Yo child process, you are done");
    setTimeout(function () {
        console.log('timeout completed');
        mongoose.connection.close();
        process.send(data);
    }, 50);
    

})

process.on('message', function (m) {
    saveEachThousand(m.store, m.individualLibData, m.libNameFromResponse, m.childProcessId, function (err, done) {
        logger.warn("child processin callback vaya");
        if (err) {
            logger.warn("child process vaya" + err);
            ee.emit("someEvent1", m.childProcessId);
            //this.send("done");

        }
        else {
            logger.warn("child process vaya " + done);
            ee.emit("someEvent1", m.childProcessId);
            //this.send("done");

        }

    });

});


function saveEachThousand(Store, individualLibData, libNameFromResponse, processID, libSaveDone) {
    logger.info(processID + ":URLStore Ready..." + Store.length);
    if (null != Store && Store.length > 0) {

        //console.log("URLStore"+value);
        logger.info(processID + ":URLStore Ready...starting download...");
        //URLStore = value;
        var URLArrayChunks = chunk(Store, 30);
        logger.info(processID + ":URLArrayChunks length" + URLArrayChunks.length);
        var Library = app.models.library;
        async.eachSeries(URLArrayChunks, function (URLStore, cb) {
            logger.info(processID + ":URLStore length" + URLStore.length);
            //cb();


            // if any of the saves produced an error, err would equal that error

            var promisedLib = new Promise(function (resolve, reject) {
                Library.find({"libName": libNameFromResponse}, function (err, libFound) {
                    if (null != libFound && libFound.length > 0) {
                        logger.info("already there!");
                        resolve(libFound);

                    } else {
                        resolve();
                    }
                    if (err) reject(err);
                });

            });

            promisedLib.then(function (value) {
                //console.log("resolved"+value); // Success!
                if (value) {
                    //console.log(URLStore.toArray());
                    logger.info(processID + ":library already there!" + value[0]._id); // Success!
                    SaveVersions(URLStore, value[0]._id, libNameFromResponse, processID, function (err, done) {

                        if (err) {
                            logger.info(processID + ":error??" + err);
                        }
                        else {
                            logger.info(processID + ":done??" + done);
                        }
                        return cb();
                    })
                } else {

                    var libraryObj = new Library({
                        libName: libNameFromResponse,
                        latest: individualLibData.results[0].latest,
                        homepage: individualLibData.results[0].homepage,
                        description: individualLibData.results[0].description

                    });
                    libraryObj.save(function (err) {
                        if (null != err)
                            logger.error(processID + ":Error Saving library Obj in DB:" + err);
                        else logger.info(processID + ":library Object Saved");
                    });
                    SaveVersions(URLStore, libraryObj._id, libNameFromResponse, processID, function (err, done) {
                        if (err) {
                            logger.info(processID + ":error??" + err);
                        }
                        else {
                            logger.info(processID + ":done??" + done);
                        }
                        return cb();
                    });
                }
            }, function (reason) {
                logger.info(processID + ":rejected" + reason); // Error!
            });
            /*promisedLib.done(function (reason) {

             });*/


        }, function (err) {
            logger.info(processID + ":chunk array is done now.");
            if (err == null)return libSaveDone(null, "done");
            else {
                logger.info(processID + ":err" + err);
                return libSaveDone(err, null);
            }

        });


    } else {
        logger.info(processID + ":moving onto next lib");
        return libSaveDone(null, "done")
        //SaveLibraries(LibNames, LibNames.next());
    }

}


function generateAST(fileContent, callback) {
    var AST, token;
    try {
        if (!fileContent.length > 0) {

            return callback(new Error("file contents empty"), null);

        }

        if (fileContent.length > 3000000) {

            return callback(new Error("file contents too big"), null);

        } else {
            AST = esprima.parse(fileContent);
			token=esprima.tokenize(fileContent);
            return callback(null, AST,token);
        }

        // the synchronous code that we want to catch thrown errors on


    } catch (err) {
        return callback(err, null,null);
    }

}
function download(libNameFromResponse, localFile, remotePath, callback) {

    var conn = mongoose.connection;
    var gfs = Grid(conn.db);
    var version;
    if(libNameFromResponse==localFile){
        var tempath=remotePath;
        tempath=tempath.replace("https://cdnjs.cloudflare.com/ajax/libs/"+libNameFromResponse+"/","");
        version=tempath.split("/");
    }
    else version = remotePath.substring(remotePath.indexOf(libNameFromResponse + '/') + libNameFromResponse.length + 1, remotePath.indexOf('/' + localFile)).split('/');
    var writestream = gfs.createWriteStream({
        filename: localFile,
        metadata: {
            url: remotePath,
            version: version
        }
    });
    var out = throttledRequest({uri: remotePath});
    out.on('response', function (resp) {
        if (resp.statusCode === 200) {
            out.pipe(writestream);
            writestream.on('close', function (localFile) {
                return callback(null, localFile);
            });
        }
        else
            return callback(new Error("No file found at given url."), null);
    }).on('error', function (e) {
        logger.error(e)
        return callback(e, null);
    }).end()
}

function SaveVersions(URLStore, libraryObjID, libNameFromResponse, processID, downLoadDone) {
    logger.info(processID + ":##############");
    async.eachSeries(URLStore, function (jsfile, cb) {

        //logger.info("##############jsfile "+jsfile);
        var filename = jsfile.split('/').reverse()[0];
        var callBackfunc = function (err, savedFile) {

            //handle error here

            if (null == err && savedFile.length>0) {
                logger.info(processID + ":working with the saved file " + savedFile.length);
                var fileContent = '';
                var conn = mongoose.connection;
                var gfs = Grid(conn.db);

                //Init the set
                var HashSet = new Set("");
                //console.log('File Saved In DB with Md5:[ ' + savedFile.metadata.url + '] & With name ' + savedFile._id);
                var readStream = gfs.createReadStream({
                    _id: savedFile._id
                });
                var chunkStream = new chunkit(readStream, {bytes: 1024}, function (err, chunk) {
                    if (err) {
                        logger.error('Error: ', err);
                        return cb();
                    }
                });
                chunkStream.on('chunk', function (chunk) {
                    fileContent += chunk.data;
                    HashSet.add(md5Hex(chunk.data));
                });
                chunkStream.on('error', function (err) {
                    logger.error('Error: ', err);
                    return cb();
                });
                chunkStream.on('end', function (stats) {
                    var promisedSavingVersion = new Promise(function (resolve, reject) {
                        logger.info('Stats: ', stats);
                        logger.info(processID + ":starting to work with AST");
                        generateAST(fileContent, function (errast, AST,token) {
                            logger.info(processID + ":esprima error" + errast);
                            if (null == errast) {
                                var writeStream = gfs.createWriteStream({
                                    filename: savedFile.filename + ".AST",
                                    metadata: {
                                        url: savedFile.metadata.url,
                                        version: savedFile.metadata.version,
                                        type: "AST",
                                        version_file_md5: savedFile.md5,
                                    }
                                });
                                //http://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
                                var stream = new Readable();
                                stream._read = function noop() {
                                };
                                logger.info(processID + ":starting to parse with JSON.stringify ");
                                stream.push(JSON.stringify(AST));

                                stream.push(null);
                                stream.pipe(writeStream);
                                writeStream.on('close', function (ASTfile) {
                                    logger.info(processID + "ASt file " + ASTfile.length);
                                    ee.emit("saveVersionWithASTEvent", AST, savedFile, libraryObjID, ASTfile._id, HashSet,token);
                                    resolve();
                                });


                            } else {
                                logger.error(processID + ":error executing esprima :" + errast);
                                ee.emit("saveVersionWithOutASTEvent", savedFile, libraryObjID, HashSet);
                                resolve();
                            }

                        });
                    });
                    promisedSavingVersion.then(function (value) {
                        logger.info("saving evrything done,moving to next lib");
                        return cb();
                    });
                });
                chunkStream.begin();


            }
            else {
                if(savedFile.length<0)
                    logger.error(processID + ":No data found in the file :" );
                else logger.error(processID + ":Error Downloading file:" + err);
                return cb();
            }
        }
        download(libNameFromResponse, filename, jsfile, callBackfunc);

    }, function (err) {

        logger.info(processID + ":all tasks finished" + err);

        if (err == null) downLoadDone(null, "done")
        else {
            logger.error(processID + ":Error." + err);
            return downLoadDone(err, null);
        }
    });

}
ee.on("saveVersionWithASTEvent", function (AST, savedFile, libraryObjID, ASTfileID, HashSet,token) {


    var funcDeclarationHashSet = new Set("");
    var funcExpressionHashSet = new Set("");
    var callExpressionHashSet = new Set("");
	var tokenHashSet = new Set("");
    //traverse
    estraverse.traverse(AST, {
        enter: function (node, parent) {
            if (node.type == 'FunctionExpression') {
                funcExpressionHashSet.add(hash.digest(node));
            }
            else if (node.type == 'FunctionDeclaration') {
                funcDeclarationHashSet.add(hash.digest(node));
            }
            else if (node.type == 'CallExpression') {
                callExpressionHashSet.add(hash.digest(node));
            }
            else estraverse.VisitorOption.Skip;

        },
        leave: function (node, parent) {
        }
    });
	
	var chunksOfTokenArrays=chunk(token,20);
	 
	for (item in chunksOfTokenArrays){
		var y=chunksOfTokenArrays[item]
		tokenHashSet.add(eshash(y,'sha1'));
	}
    var md5 = savedFile.md5;
    var fname = savedFile.filename;
    var ver = savedFile.metadata.version;
    var url = savedFile.metadata.url;
    var version = app.models.version;
    var tokenMd5=eshash(token,"md5");
    var versionObj = new version({
        filename: fname,
        version: ver,
        url: url,
        md5: md5,
        AST: ASTfileID,
        hash: HashSet.toArray(),
        source: "cdnjs.com",
        tokenisedMD5:tokenMd5,
        original:true,
        significant:true,
        funcExpressionHashSet: funcExpressionHashSet.toArray(),
        funcDeclarationHashSet: funcDeclarationHashSet.toArray(),
        callExpressionHashSet: callExpressionHashSet.toArray(),
		tokenHashSet:tokenHashSet.toArray(),
        funcExpressionHashSetLength:funcExpressionHashSet.length,
        funcDeclarationHashSetLength:funcDeclarationHashSet.length,
        callExpressionHashSetLength:callExpressionHashSet.length,
		tokensHashSetLength:chunksOfTokenArrays.length,
        library: ObjectId(libraryObjID)
    });


    versionObj.save(function (err) {
        if (null != err) {
            logger.error("Error Saving Version Obj :");
            //cb();
            //resolve();
        }

        else {
            logger.info("version saved successfully for :[" + fname + "]& version [" + ver + "]");
            app.models.library.findByIdAndUpdate(ObjectId(libraryObjID), {$push: {"versions": versionObj._id}}, function (err) {
                if (err) {
                    logger.error(err);
                    // cb();
                    //resolve();

                } else {
                    logger.info("library updated");
                    //cb();
                    //resolve();

                }
            });
        }
    });


});

ee.on("saveVersionWithOutASTEvent", function (savedFile, libraryObjID, HashSet) {
    var md5 = savedFile.md5;
    var fname = savedFile.filename;
    var ver = savedFile.metadata.version;
    var url = savedFile.metadata.url;
    var version = app.models.version;
    var versionObj = new version({
        filename: fname,
        version: ver,
        url: url,
        md5: md5,
        error: "Error generating AST",
        hash: HashSet.toArray(),
        source: "cdnjs.com",
        library: ObjectId(libraryObjID)
    });
    versionObj.save(function (err) {
        if (null != err) {
            logger.error("Error Saving Version Obj of  :" + err);
            //cb();
            //resolve();
        }

        else {
            logger.info("version saved successfully for :[" + fname + "]& version [" + ver + "]");
            app.models.library.findByIdAndUpdate(ObjectId(libraryObjID), {$push: {"versions": versionObj._id}}, function (err) {
                if (err) {
                    logger.error(err);
                    // cb();
                    //resolve();

                } else {
                    logger.info("library updated");
                    //cb();
                    //resolve();

                }
            });
        }
    });
});

/**
 * Created by MohammadMasudur on 19/05/2016.
 */
