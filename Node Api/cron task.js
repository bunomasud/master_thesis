var express = require('express');
var cron = require('node-cron');
var download = require('download-file');
var EventEmitter = require("events").EventEmitter;
var ee = new EventEmitter();
var log4js = require('log4js');


//log4j configuration

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/cronjob.log'), 'cronjob');
var logger = log4js.getLogger('cronjob');


var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;


var app = express();
app.models = require('./models/models');
mongoose.connect('mongodb://127.0.0.1:27018/DBtest102');


var url = "https://cdnjs.com/packages.min.json"

var options = {
    directory: "P:\\Thesis\\new-website-master\\new-website-master\\public",
    filename: "packages.min.json"
}


cron.schedule('15 35 18 * * *', function () {
    logger.info('Scheduler Fired Up!!');
    download(url, options, function (err) {
        if (err) {
            logger.error('Error downloading update listing. Scheduler will stop further proceedings..');
        }
        else {
            logger.info('Succesfully downloaded update listing.Scheduler will proceed to run the master downloader..');
            ee.emit("DeleteStagingCollection");
        }

    })

});


ee.on("RunMasterDownloader", runMasterDownloader);
ee.on("RunMarkRedundentFilesInMultipleLibs", markRedundantLib);
ee.on("RunMarkRedundentFilesInSingleLib", markRedundantFilesInSingleLib);
ee.on("DetectDuplicates", detectDuplicates);
ee.on("DeleteStagingCollection", clearStagingCollection);

ee.on("UpdateVerSionFromDB", function (result) {
   // console.log("Going to Update DB with result" + result)
    for (i in result) {
        // console.log(result[i]._id.libID)
        logger.info(result[i].uniqueIds)
        for (j in result[i].uniqueIds) {
            var version = app.models.version;
            version.update({"_id": ObjectId(result[i].uniqueIds[j])}, {"$set": {"original": false}}, {multi: false}, function (err, result) {
                if (err)logger.info(err);
                else logger.info("success updating library " + result)
            });
        }
    }

});

ee.on("UpdateInsingnificatsFromDB", function (result) {
    logger.info("Going to Update DB with result" + result)
    for (i in result) {
        // console.log(result[i]._id.libID)
        //console.log(result[i].uniqueIds)
        for (j in result[i].uniqueIds) {
            var version = app.models.version;
            version.update({"_id": ObjectId(result[i].uniqueIds[j])}, {"$set": {"significant": false}}, {multi: false}, function (err, result) {
                if (err) logger.error(err);
                else logger.info("success marking insignificants  " + result)
            });
        }
    }

});
function clearStagingCollection(){

    mongoose.connection.db.dropCollection('duplicate', function(err, result) {
        if(err) {
            if(err.message=="ns not found"){

                logger.info("No Prob, Still firing the Downloader")
                ee.emit("RunMasterDownloader");
            }


            logger.error("error clearing duplicate collection"+err)}
        else{
            ee.emit("RunMasterDownloader");
        }
    });
}


function detectDuplicates() {
    logger.info("Detecting duplicates has been initiated. ");
    var version = app.models.version;
    version.aggregate([
        {
            "$group": {
                "_id": {"firstField": "$tokenisedMD5"},
                "uniqueIds": {"$addToSet": "$_id"},
                "uniqueLibIds": {"$addToSet": "$library"},
                "count": {"$sum": 1}
            }
        },
        {"$match": {"count": {"$gt": 1}}},
        {"$out": "duplicate"}
    ], function (err, result) {
        if (err) logger.error(err)
        else {
            logger.info("Duplicated detected, Proceeding to mark the originals");
            ee.emit("RunMarkRedundentFilesInMultipleLibs");
            ee.emit("RunMarkRedundentFilesInSingleLib");
        }
    });

}

function runMasterDownloader() {
    logger.info("Download event initiated");
    var child = require('child_process').fork('master_downloader.js');
    child.on('close', function (code) {
        logger.info('Downloader finished downloading. Scheduler will proceed to mark redundencies from the fingerprint DB.');
        ee.emit("DetectDuplicates");

    });
    child.on('error', function (error) {
        logger.info('Downloader casued error ' + error);
    });
}

function markRedundantLib() {
    logger.info("Marking redundant lib event initiated");


    var redundantList = ["jquery", "jquery-placeholder", "jquery-cookie", "jquery-mousewheel", "jquery-easing", "angular.js", "angular-resource", "angular-messages", "angular-touch", "bootstrap-datepicker", "underscore.js", "spectrum", "prettify", "modernizr", "html5shiv", "moment.js"];
    var library = app.models.library;
    for (lib in redundantList) {
        library.findOne({"libName": redundantList[lib]}, function (err, libDetails) {
            if (!err) {
                if (null != libDetails) {
                    logger.info(libDetails);
                    logger.info(libDetails.libName);
                    logger.info(libDetails._id);
                    var lib = app.models.library;
                    lib.aggregate([
                        {
                            $match: {
                                libName: libDetails.libName
                            }

                        },
                        {$unwind: "$versions"},
                        {
                            $lookup: {
                                from: "versions",
                                localField: "versions",
                                foreignField: "_id",
                                as: "ver_details"
                            }
                        },
                        {
                            $project: {
                                hash: "$ver_details.tokenisedMD5"
                            }

                        },
                        {
                            $unwind: "$hash"
                        },
                        {

                            $lookup: {

                                from: "duplicate",
                                localField: "hash",
                                foreignField: "_id.firstField",
                                as: "copys"

                            }

                        },
                        {
                            $unwind: "$copys"


                        },
                        {
                            $unwind: "$copys.uniqueIds"


                        },
                        {
                            $lookup: {

                                from: "versions",
                                localField: "copys.uniqueIds",
                                foreignField: "_id",
                                as: "duplicateVersions"

                            }
                        },

                        {
                            $unwind: "$duplicateVersions"


                        },
                        {
                            $project: {
                                _id: 1, hash: 1, copys: "$copys", duplicateLibId: "$duplicateVersions.library"
                            }
                        }, {
                            $group: {

                                "_id": {"libID": "$duplicateLibId"},
                                "uniqueIds": {"$addToSet": "$copys.uniqueIds"}

                            }

                        },
                        {
                            $match: {
                                "_id.libID": {$ne: ObjectId(libDetails._id)}
                            }

                        }


                    ], function (err, result) {
                        if (err) console.log(err)
                        else {
                            ee.emit("UpdateVerSionFromDB", result);

                        }
                    });

                }
            }


        });
    }


}


function markRedundantFilesInSingleLib() {

    logger.info("Marking insignificant  files in a single library  event initiated");
    var duplicate = app.models.duplicate;
    duplicate.aggregate([
        {
            "$match": {

                "uniqueLibIds": {

                    "$size": 1

                }

            }

        }

    ], function (err, result) {
        if (err) logger.error(err)
        else {
            logger.info("Duplicated detected, Proceeding to mark the the insignificants"+result);
            ee.emit("UpdateInsingnificatsFromDB", result);
        }
    });


}



