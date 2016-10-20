var express = require('express');
var mongoose = require('mongoose');
//var bodyParser = require('body-parser');
//var methodOverride = require('method-override');
var async = require("async");
var fs = require('fs');
var _ = require('lodash');
var request = require('request');
var throttledRequest = require('throttled-request')(request)
var Grid = require('gridfs-stream');
var Client = require('node-rest-client').Client;
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
var ps = require('ps-node');
var busyLoop = require('busy-loop');
var estraverse = require('estraverse');
var hash = require('json-hash');
var eshash = require('es-hash');


//busy loop
busyLoop(function (amount) {
    logger.debug(' master Loop was busy for ' + amount + ' ms');
});


var pool = 0;

//blocks
blocked(function (ms) {
    logger.debug(" master Blocked" + ms);
});

//event emiiter
var ee = new EventEmitter();
ee.on("someEvent", function (store, individualLibData, libNameFromResponse) {
    var child = require('child_process').fork('child_downloader.js');

    child.send({
        store: store,
        libNameFromResponse: libNameFromResponse,
        individualLibData: individualLibData,
        childProcessId: child.pid
    });
    child.on('close', function (code) {
        logger.fatal('child closed ');
        pool = pool - 1;
        logger.fatal('after child pool value is:[' + pool + "]");
    });
    child.on('error', function (code) {
        logger.fatal('child  error  ' + code);
        pool = pool - 1;

    });

    child.on('message', function (pid) {
        logger.fatal('child message: done baby');
        ps.kill(pid, function (err) {
            if (err) {
                throw new Error(err);
            }
            else {
                logger.fatal('Process %s has been killed!', pid);

            }
        });


    });

});

//log4j configuration

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/master_downloader.log'), 'masterdownloader');
var logger = log4js.getLogger('masterdownloader');

var ObjectId = mongoose.Types.ObjectId;

//This will throttle the requests so no more than 5 are made every second

throttledRequest.configure({
    requests: 10,
    milliseconds: 1000
});

//Creating rest Api Client
var client = new Client();
//adding mongoose to grid
Grid.mongo = mongoose.mongo;
// Create the application.
var app = express();


app.use(log4js.connectLogger(logger, {level: 'auto'}));

app.models = require('./models/models');
// Connect to MongoDB
var dbURI = 'mongodb://127.0.0.1:27018/DBtest102';
mongoose.connect(dbURI);


client.registerMethod("jsonMethod", "http://127.0.0.1:5050/libraries", "GET");
var req = client.methods.jsonMethod({}, function (data, response) {

    if (response.statusCode == 200) {
        var libNames = [];
        libNames=["backbone.marionette","Trumbowyg","angular.js","backbone.js","angular-i18n","yui"];
       // libNames=["mediaelement"];
/*        for (var item in data.results) {
            libNames.push(data.results[item].name);
        }
           SaveLibraries("angular.js", function (err, done) {
         logger.info("download finished with error " + err);
         logger.info("download finished" + done);
         if(done){
         mongoose.connection.close(function () {
         console.log('Mongoose default connection disconnected through app termination');
         process.exit(0);
         });
         }

         });*/
        /*        async.eachSeries(libNames, function (libname, cb) {
         try {
         logger.info("pool" + pool);
         logger.info("working with" + libname);
         SaveLibraries(libname, function (err, done) {
         cb();
         });

         } catch (err) {

         logger.error("err" + err);
         }

         }, function done() {

         logger.info("download finished");
         mongoose.connection.close(function () {
         console.log('Mongoose default connection disconnected through app termination');
         process.exit(0);
         });
         });*/


        //Updated
       async.eachSeries(libNames, function (libname, cb) {
                try {
                    logger.info("pool" + pool);
                    logger.info("working with" + libname);
                    SaveLibraries(libname, function (err, done) {
                        cb();
                    });

                } catch (err) {

                    logger.error("err" + err);
                }

            },

            function done() {

                logger.info("download finished, waiting for timeout....");

                setTimeout(function () {
                    mongoose.connection.close(function () {
                        logger.info('Mongoose default connection disconnected through app termination');
                        process.exit(0);
                    });

                }, 500);

            }
        );
    }


});

req.on('requestTimeout', function (req) {
    logger.error('request has expired');
    req.abort();
});

req.on('responseTimeout', function (res) {
    logger.error('response has expired');

});


//it's usefull to handle request errors to avoid, for example, socket hang up errors on request timeouts
req.on('error', function (err) {
    logger.error(' local error', err);
});

function saveEachThousand(Store, individualLibData, libNameFromResponse, libSaveDone) {
    logger.info("URLStore Ready..." + Store.length);
    if (null != Store && Store.length > 0) {

        //console.log("URLStore"+value);
        logger.info("URLStore Ready...strating download...");
        //URLStore = value;
        var URLArrayChunks = chunk(Store, 30);
        //logger.info("URLArrayChunks length" + URLArrayChunks.length);
        var Library = app.models.library;
        async.eachSeries(URLArrayChunks, function (URLStore, cb) {
            logger.info("URLStore length" + URLStore.length);
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
                //logger.info("resolved"+value); // Success!
                if (value) {
                    //console.log(URLStore.toArray());
                    logger.info("library already there!" + value[0]._id); // Success!
                    SaveVersions(URLStore, value[0]._id, libNameFromResponse, function (err, done) {

                        if (err) {
                            logger.info("done??" + done);
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
                            logger.error("Error Saving library Obj in DB:" + err);
                        else logger.info("library Object Saved");
                    });
                    SaveVersions(URLStore, libraryObj._id, libNameFromResponse, function (err, done) {
                        if (err) logger.info("err" + err);
                        else logger.info("done??" + done);
                        return cb();
                    });
                }
            }, function (reason) {
                logger.info("rejected" + reason); // Error!
            });
            /*promisedLib.done(function (reason) {

             });*/


        }, function (err) {
            logger.info("chunk array is done now.");
            if (err == null)libSaveDone(null, "done");
            else {
                logger.error("err" + err);
                return libSaveDone(err, null);
            }

        });


    } else {
        logger.info("moving onto next lib");
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

        }


        else {
            AST = esprima.parse(fileContent);
            token = esprima.tokenize(fileContent);
            return callback(null, AST, token);
        }

        // the synchronous code that we want to catch thrown errors on


    } catch (err) {
        return callback(err, null, null);
    }

}
function download(libNameFromResponse, localFile, remotePath, callback) {

    var conn = mongoose.connection;
    var gfs = Grid(conn.db);
    var version;

    if (libNameFromResponse == localFile) {
        var tempath = remotePath;
        tempath = tempath.replace("https://cdnjs.cloudflare.com/ajax/libs/" + libNameFromResponse+"/", "");
        version = tempath.split("/");
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

function SaveVersions(URLStore, libraryObjID, libNameFromResponse, downLoadDone) {
    logger.info("##############");
    async.eachSeries(URLStore, function (jsfile, cb) {

        logger.info("##############jsfile " + jsfile);
        var filename = jsfile.split('/').reverse()[0];
        logger.info("##############jsfile name " + filename);
        var callBackfunc = function (err, savedFile) {

            //handle error here

            if (null == err && savedFile.length > 0) {
                logger.info("working with the saved file " + savedFile.length);
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
                        logger.info('working with esprima' + fileContent.length);
                        generateAST(fileContent, function (err, AST, token) {
                            if (null == err) {
                                //save the AST
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
                                logger.info("starting to parse with JSON.stringify ");
                                stream.push(JSON.stringify(AST));
                                stream.push(null);
                                stream.pipe(writeStream);
                                writeStream.on('close', function (ASTfile) {
                                    logger.info("ASt file " + ASTfile.length);

                                    ee.emit("saveVersionWithASTEvent", AST, savedFile, libraryObjID, ASTfile._id, HashSet, token);
                                    resolve();

                                });


                            } else {
                                logger.error("error executing esprima :" + err);

                                ee.emit("saveVersionWithOutASTEvent", savedFile, libraryObjID, HashSet);
                                resolve();


                            }

                        });

                    });
                    promisedSavingVersion.then(function (value) {
                        logger.info("saving everything done,moving to next lib");
                        return cb();
                    });
                });
                chunkStream.begin();


            }
            else {
                logger.error("Error Downloading file:" + err);
                return cb();
            }

        }
        download(libNameFromResponse, filename, jsfile, callBackfunc);

    }, function (err) {

        logger.info("all taks are done now.");

        if (err == null) return downLoadDone(null, "done")
        else {
            logger.error("Error." + err);
            return downLoadDone(err, null);
        }
    });

}


function SaveLibraries(libName, libSaveDone) {
    //logger.info("####"+libName);
    if (null != libName && libName.length > 0) {
        var req = client.get("http://127.0.0.1:5050/libraries/" + "?search=" + libName + "&fields=assets,description,homepage", function (individualLibData, response) {
            // parsed response body as js object


            if (response.statusCode == 200) {
                logger.info("####" + "api server worked" + individualLibData);
                if (null == individualLibData.results || individualLibData.results.length == 0) {
                    logger.info("####" + "Invalid Libname");
                    return libSaveDone(new Error("undefined libname: No results returned!!"), null);
                }

                var libNameFromResponse = response.req._header.toString().substring(response.req._header.toString().lastIndexOf("?search=") + 8, response.req._header.toString().indexOf("&fields=assets,description,homepage"));
                var fileName, version;
                var URLStore = [];
                //var versionnumbers = [];
                var total = 0;
                var promiseStore = new Promise(function (resolveStore, rejectStore) {
                    for (var item in individualLibData.results[0].assets) {
                        //var files = individualLibData.results[0].assets[item].files.length;
                        for (file in individualLibData.results[0].assets[item].files) {
                            fileName = individualLibData.results[0].assets[item].files[file];
                            if (/js$/.test(fileName)) {
                                total = total + 1;
                            }
                        }
                        //total = total + files;
                    }
                    logger.warn("total files" + total);


                    //logger.warn("assests size"+individualLibData.results[0].assets.length);
                    for (var item in individualLibData.results[0].assets) {
                        var tempURLStore = [];

                        version = individualLibData.results[0].assets[item].version;
                        for (file in individualLibData.results[0].assets[item].files) {
                            //tempURLStore = [];
                            fileName = individualLibData.results[0].assets[item].files[file];

                            if (/js$/.test(fileName)) {
                                var URL = "https://cdnjs.cloudflare.com/ajax/libs/" + libNameFromResponse + "/" + version + "/" + fileName;
                                //console.log(URL);
                                var promise = new Promise(function (resolve, reject) {
                                    var URLPromise = Promise.resolve(URL);
                                    //var fileNamePromise=Promise.resolve(libNameFromResponse);
                                    //logger.info("URL"+URL);
                                    //logger.info("LIB"+fileNamePromise.done);
                                    app.models.version.find({"url": URL}, function (err, urlFound) {
                                        //console.log("parameter"+URLPromise);
                                        //logger.info("urlFound"+urlFound);
                                        if (null != urlFound && urlFound.length > 0) {
                                            logger.info("already there!");
                                            resolve();

                                        } else {
                                            resolve(URLPromise);
                                        }
                                        if (err) reject(err);

                                    });
                                });
                                promise.then(function (value) {

                                    if (value) {
                                        logger.info("resolved" + value);
                                        tempURLStore.push(value);
                                        if (total > 45 && pool <= 3 && tempURLStore.length > (total / 6 )) {

                                            ee.emit("someEvent", tempURLStore, individualLibData, libNameFromResponse);
                                            tempURLStore = [];
                                            pool = pool + 1;
                                            logger.fatal('EventEmit: pool value is:[' + pool + "]");

                                        }

                                    }

                                }, function (reason) {
                                    logger.info("rejected" + reason); // Error!
                                });
                            }
                        }

                    }
                    Promise.all([promise]).then(function (values) {
                        logger.info("finished promisses for..");
                        resolveStore(tempURLStore);// [true, 3]

                    })


                });
                promiseStore.done(function (value) {
                    logger.info("working with promise" + value.length);
                    saveEachThousand(value, individualLibData, libNameFromResponse, libSaveDone)

                });
            }

        });
        req.on('requestTimeout', function (req) {
            logger.error('request has expired');
            req.abort();
        });

        req.on('responseTimeout', function (res) {
            logger.error('response has expired');

        });
        req.on('error', function (err) {
            logger.error(' local error', err);
        });
    }
    else {
        logger.error("Undefined libname");
        return libSaveDone(new Error("undefined libname"), null);

    }


}
ee.on("saveVersionWithASTEvent", function (AST, savedFile, libraryObjID, ASTfileID, HashSet, token) {


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

    var chunksOfTokenArrays = chunk(token, 20);

    for (item in chunksOfTokenArrays) {
        var y = chunksOfTokenArrays[item]
        tokenHashSet.add(eshash(y, "sha1"));
    }


    var md5 = savedFile.md5;
    var fname = savedFile.filename;
    var ver = savedFile.metadata.version;
    var url = savedFile.metadata.url;
    var version = app.models.version;
    var tokenMd5 = eshash(token, "md5");
    var versionObj = new version({
        filename: fname,
        version: ver,
        url: url,
        md5: md5,
        AST: ASTfileID,
        hash: HashSet.toArray(),
        source: "cdnjs.com",
        original:true,
        significant:true,
        tokenisedMD5: tokenMd5,
        funcExpressionHashSet: funcExpressionHashSet.toArray(),
        funcDeclarationHashSet: funcDeclarationHashSet.toArray(),
        callExpressionHashSet: callExpressionHashSet.toArray(),
        tokenHashSet: tokenHashSet.toArray(),
        funcExpressionHashSetLength: funcExpressionHashSet.length,
        funcDeclarationHashSetLength: funcDeclarationHashSet.length,
        callExpressionHashSetLength: callExpressionHashSet.length,
        tokensHashSetLength: chunksOfTokenArrays.length,
        library: ObjectId(libraryObjID)
    });


    versionObj.save(function (err) {
        if (null != err) {
            logger.error("Error Saving Version Obj :");
        }
        else {
            logger.info("version saved successfully for :[" + fname + "]& version [" + ver + "]");
            app.models.library.findByIdAndUpdate(ObjectId(libraryObjID), {$push: {"versions": versionObj._id}}, function (err) {
                if (err) {
                    logger.error(err);
                } else {
                    logger.info("library updated");
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
        }

        else {
            logger.info("version saved successfully for :[" + fname + "]& version [" + ver + "]");
            app.models.library.findByIdAndUpdate(ObjectId(libraryObjID), {$push: {"versions": versionObj._id}}, function (err) {
                if (err) {
                    logger.error(err);

                } else {
                    logger.info("library updated");

                }
            });
        }
    });
});


mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});

