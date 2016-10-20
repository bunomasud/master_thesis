var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var async = require("async");
var fs = require('fs');
var _ = require('lodash');
var request = require('request');
var Grid = require('gridfs-stream');
var Client = require('node-rest-client').Client;
var esprima = require('esprima');
var chunkit = require('chunkit');
var Set = require("collections/set");
var log4js = require('log4js');
var chunk = require('chunk');
var blocked = require('blocked');
var ps = require('ps-node');
var busyLoop = require('busy-loop');
var estraverse = require('estraverse');
var hash = require('json-hash');
const md5Hex = require('md5-hex');


//busy loop
busyLoop(function (amount) {
    logger.debug(' master Loop was busy for ' + amount + ' ms');
});


var pool = 0;

//blocks
blocked(function (ms) {
    logger.debug(" master Blocked" + ms);
});


//log4j configuration

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/server.log'), 'server');
var logger = log4js.getLogger('server');




// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for dying workers
    cluster.on('exit', function (worker) {

        // Replace the dead worker, we're not sentimental
        console.log('Worker %d died :(', worker.id);
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {


    var client = new Client();
//adding mongoose to grid
    Grid.mongo = mongoose.mongo;
// Create the application.
    var app = express();

// Connect to MongoDB
    mongoose.connect('mongodb://127.0.0.1:27018/DBtest101', {config: {autoIndex: false}});
//adding task queue


// Add Middleware necessary for REST API's
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(methodOverride('X-HTTP-Method-Override'));

// CORS Support
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });

    app.use(log4js.connectLogger(logger, {level: 'auto'}));
// File upload
    var multiparty = require('multiparty');
    var uuid = require('node-uuid');
    var path = require('path');
//Create file upload link
    app.use("/public", express.static(path.join(__dirname, 'public')));
    app.route('/upload/file/')
        .post(function (req, res, next) {
            var form = new multiparty.Form();
            //return res.status(200).json({'Crap':'NO'});
            form.parse(req, function (err, fields) {
			
				if(err){
					logger.debug('server failed to response');
					return res.status(500).json({'error':'Server Failed to response'});
				}
					
					
                console.log(fields.filePath[0]);
                var filePath = fields.filePath[0];
                //var fileContents = fs.readFileSync(destPath, "utf8");
                fs.readFile(filePath, 'utf8', function (err, data) {
                    if (err) {
                        logger.debug('file read error' + err);
                        return res.status(500).json('File not can not be read');
                    }
                    //console.log(data);
                    try {
                        var AST = esprima.parse(data);

                        var uploadedFileFuncExpressionHashSet = new Set("");
                        var uploadedFileFuncDeclarationHashSet = new Set("");
                        var uploadedFileCallExpressionHashSet = new Set("");
                        //var callEXP=0
                        logger.debug('working with AST');

                        estraverse.traverse(AST, {
                            enter: function (node, parent) {
                                if (node.type == 'FunctionExpression') {
                                    uploadedFileFuncExpressionHashSet.add(hash.digest(node));
                                }
                                else if (node.type == 'FunctionDeclaration') {
                                    uploadedFileFuncDeclarationHashSet.add(hash.digest(node));
                                }
                                else if (node.type == 'CallExpression') {
                                    uploadedFileCallExpressionHashSet.add(hash.digest(node));
                                    //  callEXP++;
                                }
                                else estraverse.VisitorOption.Skip;

                            },
                            leave: function (node, parent) {
                            }
                        });

                        //console.log(callEXP);
                        logger.debug('promise done,FunctionExpression length' + uploadedFileFuncExpressionHashSet.length);
                        logger.debug('promise done,uploadedFileFuncDeclarationHashSet length' + uploadedFileFuncDeclarationHashSet.length);
                        logger.debug('promise done,uploadedFileCallExpressionHashSet length' + uploadedFileCallExpressionHashSet.length);
                        // console.log('working with AST done,FunctionExpression length'+uploadedFileFuncExpressionHashSet.length);
                        var version = app.models.version;

                        if (uploadedFileFuncExpressionHashSet.length > 10) {
                            var rangeUpperEx = uploadedFileFuncExpressionHashSet.length + 5;
                            var rangeLowerEx = uploadedFileFuncExpressionHashSet.length - 5;
                        }
                        else if(uploadedFileFuncExpressionHashSet.length ==0){
                            var rangeUpperEx=1;
                            var rangeLowerEx=-1;
                        }
                        else {
                            var rangeUpperEx = uploadedFileFuncExpressionHashSet.length+1;
                            var rangeLowerEx = uploadedFileFuncExpressionHashSet.length-1;
                        }
                        if (uploadedFileCallExpressionHashSet.length>10) {
                            var rangeUpperCallEx = uploadedFileCallExpressionHashSet.length + 5;
                            var rangeLowerCallEx = uploadedFileCallExpressionHashSet.length - 5;
                        }
                        else if(uploadedFileCallExpressionHashSet.length==0){
                            var rangeUpperCallEx =1;
                            var rangeLowerCallEx = -1;
                        }
                        else {
                            var rangeUpperCallEx = uploadedFileCallExpressionHashSet.length+1;
                            var rangeLowerEx = uploadedFileCallExpressionHashSet.length-1;
                        }
                        if(uploadedFileFuncDeclarationHashSet.length==0){
                            var rangeUpperDec=1;
                            var rangeLowerDec=-1;

                         }else if(uploadedFileFuncDeclarationHashSet.length>10){
                            var rangeUpperDec = uploadedFileFuncDeclarationHashSet.length + 5;
                            var rangeLowerDec = uploadedFileFuncDeclarationHashSet.length - 5;
                         }
                        else{
                            var rangeUpperDec = uploadedFileFuncDeclarationHashSet.length + 1;
                            var rangeLowerDec = uploadedFileFuncDeclarationHashSet.length - 1;
                        }
                        var date = new Date();
                        var startTime = date.getTime();
                        logger.debug("time before the DB Query" + startTime);
                        version.aggregate(
                            [
                                {
                                    $match: {

                                        "funcExpressionHashSet": {$exists: true},
                                        "callExpressionHashSet": {$exists: true},
                                        "funcDeclarationHashSet": {$exists: true},
                                        "funcExpressionHashSetLength":{$gt: rangeLowerEx, $lt: rangeUpperEx},
                                        "funcDeclarationHashSetLength":{$gt: rangeLowerDec, $lt: rangeUpperDec},
                                        "callExpressionHashSetLength": {$gt: rangeLowerCallEx, $lt: rangeUpperCallEx},
                                       // "funcExpressionHashSetLength": uploadedFileFuncExpressionHashSet.length,
                                        //"funcDeclarationHashSetLength":uploadedFileFuncDeclarationHashSet.length,
                                        //"callExpressionHashSetLength":uploadedFileCallExpressionHashSet.length,
                                        // "callExpressionHashSetLength":callEXP
                                    }
                                },

                                {
                                    $project: {
                                        url: 1, filename: 1, version: 1, IntersectionLengthFuncEx: {
                                            "$size": {
                                                "$setIntersection": [
                                                    uploadedFileFuncExpressionHashSet.toArray()
                                                    ,
                                                    "$funcExpressionHashSet"
                                                ]
                                            }
                                        }, /*IntersectionLengthFuncDec: {
                                         "$size": {
                                         "$setIntersection": [
                                         uploadedFileFuncDeclarationHashSet.toArray()
                                         ,
                                         "$funcDeclarationHashSet"
                                         ]
                                         }

                                         },*/
                                        IntersectionLengthCallExp: {
                                            "$size": {
                                                "$setIntersection": [
                                                    uploadedFileCallExpressionHashSet.toArray()
                                                    ,
                                                    "$callExpressionHashSet"
                                                ]
                                            }

                                        },
                                        /*UnionLengthFuncDec: {
                                         "$size": {
                                         "$setUnion": [
                                         uploadedFileFuncDeclarationHashSet.toArray()
                                         ,
                                         "$funcDeclarationHashSet"
                                         ]
                                         }

                                         },*/
                                        UnionLengthFuncEX: {
                                            "$size": {
                                                "$setUnion": [
                                                    uploadedFileFuncExpressionHashSet.toArray()
                                                    ,
                                                    "$funcExpressionHashSet"
                                                ]
                                            }

                                        },
                                        UnionLengthCallEX: {
                                            "$size": {
                                                "$setUnion": [
                                                    uploadedFileCallExpressionHashSet.toArray()
                                                    ,
                                                    "$callExpressionHashSet"
                                                ]
                                            }

                                        }
                                    }
                                },
                                {
                                    $match: {
                                        $or: [
                                            {
                                                IntersectionLengthFuncEx: {
                                                    $ne: 0,
                                                    $gt: rangeLowerEx,
                                                    $lt: rangeUpperEx
                                                },
                                                UnionLengthFuncEX: {$ne: 0, $gt: rangeLowerEx, $lt: rangeUpperEx}
                                            }, /*{
                                             IntersectionLengthFuncDec: {
                                             $ne:0,
                                             $gt: rangeLowerDec,
                                             $lt: rangeUpperDec
                                             },
                                             UnionLengthFuncDec: {$ne:0,$gt: rangeLowerDec, $lt: rangeUpperDec}
                                             },*/
                                            {
                                                IntersectionLengthCallExp: {
                                                    $ne: 0,
                                                    $gt: rangeLowerCallEx,
                                                    $lt: rangeUpperCallEx
                                                },
                                                UnionLengthCallEX: {
                                                    $ne: 0,
                                                    $gt: rangeLowerCallEx,
                                                    $lt: rangeUpperCallEx
                                                }
                                            }

                                        ]


                                    }
                                }

                            ],

                            function (err, result) {
                                if (err) {
									res.set("Connection", "close");
                                    //logger.debug('Got err.' + err);
                                    return res.status(500).json('Internal server error..');
                                } else {
									res.set("Connection", "close");
                                    logger.debug('Got result.');
                                    var date = new Date();
                                    var endTime = date.getTime();
                                    logger.debug("time After the DB Query" + endTime);
                                    logger.debug("Diff" + (endTime - startTime) / 1000);
                                    return res.json(result
                                        /*  url: result[0].url,
                                         fileName: result[0].filename,
                                         intersectionLength:result[0].IntersectionLength,
                                         version:result[0].version*/
                                    );
                                }


                            });

                    } catch (err) {
						res.set("Connection", "close");
                        return res.status(500).json([{
                            error: "Esprima Failed"
                        }]);
                        logger.debug('Got esprima error:' + err);

                        var HashSet = new Set("");
                        var stream = fs.createReadStream(destPath);
                        var chunkStream = new chunkit(stream, {bytes: 1024}, function (err, chunk) {
                            if (err) {
                                logger.error('chunk Error initialization: ', err);
                                return res.status(500).json('File not can not be chunked');
                            }
                        });
                        chunkStream.on('chunk', function (chunk) {
                            //fileContent += chunk.data;
                            HashSet.add(md5Hex(chunk.data));
                        });
                        chunkStream.on('error', function (err) {
                            logger.error('Error while chunking: ', err);
                            return res.status(500).json('File not can not be chunked');
                            //return cb();
                        });
                        chunkStream.on('end', function (stats) {
                            var version = app.models.version;
                            version.aggregate(
                                [
                                    {
                                        $match: {

                                            "hash": {$exists: true, $ne: []},
                                            "hash": {$size: HashSet.length}
                                        }
                                    },

                                    {
                                        $project: {
                                            url: 1, filename: 1, version: 1, IntersectionLengthHash: {
                                                "$size": {
                                                    "$setIntersection": [
                                                        HashSet.toArray()
                                                        ,
                                                        "$hash"
                                                    ]
                                                }
                                            },
                                            UnionLengthHash: {
                                                "$size": {
                                                    "$setUnion": [
                                                        HashSet.toArray()
                                                        ,
                                                        "$hash"
                                                    ]
                                                }

                                            }
                                        }
                                    },
                                    {
                                        $match: {
                                            IntersectionLengthHash: {
                                                $gt: HashSet.length + 10,
                                                $lt: HashSet.length - 10
                                            },
                                            UnionLengthHash: {$gt: HashSet.length + 10, $lt: HashSet.length - 10}

                                        }
                                    }

                                ],

                                function (err, result) {
                                    if (err) {
                                        logger.debug('Got hash err.' + err);
                                        return res.status(500).json('Internal server hash error vaya');
                                    } else {
                                        //logger.debug('Got result.' + result[0]);
                                        return res.json(result
                                            /*  url: result[0].url,
                                             fileName: result[0].filename,
                                             intersectionLength:result[0].IntersectionLength,
                                             version:result[0].version*/
                                        );
                                    }


                                });

                        });
                    }
                });

            });
        });
    mongoose.connection.once('open', function () {

        // Load the models.
        app.models = require('./models/models');

        // Load the routes.
        var routes = require('./routes');
        _.each(routes, function (controller, route) {
            app.use(route, controller(app, route));
        });
        console.log('Listening on port 3000...');
        /*    logger.trace('Entering cheese testing');
         logger.debug('Got cheese.');
         logger.info('Cheese is Gouda.');
         logger.warn('Cheese is quite smelly.');
         logger.error('Cheese is too ripe!');
         logger.fatal('Cheese was breeding ground for listeria.');*/
        app.listen(3000);
    });

}



