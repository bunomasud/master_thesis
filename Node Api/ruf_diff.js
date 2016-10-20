var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
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
const crypto = require('crypto');



//This will throttle the requests so no more than 5 are made every second

throttledRequest.configure({
    requests: 5,
    milliseconds: 1000
});

//Creating rest Api Client
var client = new Client();
//adding mongoose to grid
Grid.mongo = mongoose.mongo;
// Create the application.
var app = express();

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

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27018/demo-dev');
mongoose.connection.once('open', function () {

    // Load the models.
    app.models = require('./models/models');

    // Load the routes.
    var routes = require('./routes');
    _.each(routes, function (controller, route) {
        app.use(route, controller(app, route));
    });
    console.log('Listening on port 3000...');
    app.listen(3000);

    var google_CDN_versions = ["2.2.2", "2.2.1", "2.2.0", "2.1.4", "2.1.3", "2.1.1", "2.1.0", "2.0.3", "2.0.2", "2.0.1", "2.0.0", "1.12.2", "1.12.1", "1.12.0", "1.11.3", "1.11.2", "1.11.1", "1.11.0", "1.10.2", "1.10.1", "1.10.0", "1.9.1", "1.9.0", "1.8.3", "1.8.2", "1.8.1", "1.8.0", "1.7.2", "1.7.1", "1.7.0", "1.6.4", "1.6.3", "1.6.2", "1.6.1", "1.6.0", "1.5.2", "1.5.1", "1.5.0", "1.4.4", "1.4.3", "1.4.2", "1.4.1", "1.4.0", "1.3.2", "1.3.1", "1.3.0", "1.2.6", "1.2.3"];
    var google_CDN_versions_jqueryui=["1.11.4", "1.11.3", "1.11.2", "1.11.1", "1.11.0", "1.10.4", "1.10.3", "1.10.2", "1.10.1", "1.10.0", "1.9.2", "1.9.1", "1.9.0", "1.8.24", "1.8.23", "1.8.22", "1.8.21", "1.8.20", "1.8.19", "1.8.18", "1.8.17", "1.8.16", "1.8.15", "1.8.14", "1.8.13", "1.8.12", "1.8.11", "1.8.10", "1.8.9", "1.8.8", "1.8.7", "1.8.6", "1.8.5", "1.8.4", "1.8.2", "1.8.1", "1.8.0", "1.7.3", "1.7.2", "1.7.1", "1.7.0", "1.6.0", "1.5.3", "1.5.2"];


    for (var item in google_CDN_versions){

        app.models.version.find({"filename" : "jquery.js","version" : [ google_CDN_versions[item]]}, function (err, docs) {
            // docs is an array

            //console.log(docs[0].source);
            //console.log(docs[1].source);
            //console.log(docs.length)
            //Init the set
            var HashSet1 = new Set("");
            var HashSet2 = new Set("");

            if(null==err && docs.length==2 && ((docs[0].source=="google" &&  docs[1].source=="cdnjs.com") ||(docs[0].source=="cdnjs.com" &&  docs[1].source=="google") ) ){

                var hash1=docs[0].hash;
                var hash2=docs[1].hash;

                for (var item in hash1){
                    HashSet1.add(hash1[item]);
                }

                for (var item in hash2){
                    HashSet2.add(hash2[item]);
                }
                var intersectionSet=HashSet1.intersection(HashSet2);
                var UnionSet=HashSet1.union(HashSet2);
                console.log("------------------------------------------------------------------------------------");
                console.log( "InterSection length for version "+docs[0].version+ "["+intersectionSet.length+"]");
                console.log( "Union length for version "+docs[0].version+ "["+UnionSet.length+"]");
                console.log("Jaccard distance based on hash:"+(1-intersectionSet.length/UnionSet.length));
                console.log("--------------------------------------------------------------------------------------");

            }else {
                try{
                    console.log("query returned unexpected results for version"+docs[0].source+docs[0].version);
                }catch(err){
                    console.log("err................................");
                }



            }

        });

        app.models.version.find({"filename" : "jquery.min.js","version" : [ google_CDN_versions[item]]}, function (err, docs) {
            // docs is an array

            //console.log(docs[0].source);
            //console.log(docs[1].source);
            //console.log(docs.length)
            //Init the set
            var HashSet1 = new Set("");
            var HashSet2 = new Set("");

            if(null==err && docs.length==2 && ((docs[0].source=="google" &&  docs[1].source=="cdnjs.com") ||(docs[0].source=="cdnjs.com" &&  docs[1].source=="google") ) ){

                var hash1=docs[0].hash;
                var hash2=docs[1].hash;

                for (var item in hash1){
                    HashSet1.add(hash1[item]);
                }

                for (var item in hash2){
                    HashSet2.add(hash2[item]);
                }
                var intersectionSet=HashSet1.intersection(HashSet2);
                var UnionSet=HashSet1.union(HashSet2);
                console.log("------------------------------------------------------------------------------------");
                console.log( "InterSection length for version "+docs[0].version+ "["+intersectionSet.length+"]");
                console.log( "Union length for version "+docs[0].version+ "["+UnionSet.length+"]");
                console.log("Jaccard distance based on hash:"+(1-intersectionSet.length/UnionSet.length));
                console.log("--------------------------------------------------------------------------------------");

            }else {
                try{
                    console.log("query returned unexpected results for version"+docs[0].source+docs[0].version);
                }catch(err){
                    console.log("err................................");
                }



            }

        });

    }

    for (var item in google_CDN_versions_jqueryui){

        app.models.version.find({"filename" : "jquery.js","version" : [ google_CDN_versions[item]]}, function (err, docs) {
            // docs is an array

            //console.log(docs[0].source);
            //console.log(docs[1].source);
            //console.log(docs.length)
            //Init the set
            var HashSet1 = new Set("");
            var HashSet2 = new Set("");

            if(null==err && docs.length==2 && ((docs[0].source=="google" &&  docs[1].source=="cdnjs.com") ||(docs[0].source=="cdnjs.com" &&  docs[1].source=="google") ) ){

                var hash1=docs[0].hash;
                var hash2=docs[1].hash;

                for (var item in hash1){
                    HashSet1.add(hash1[item]);
                }

                for (var item in hash2){
                    HashSet2.add(hash2[item]);
                }
                var intersectionSet=HashSet1.intersection(HashSet2);
                var UnionSet=HashSet1.union(HashSet2);
                console.log("------------------------------------------------------------------------------------");
                console.log( "InterSection length for version "+docs[0].version+ "["+intersectionSet.length+"]");
                console.log( "Union length for version "+docs[0].version+ "["+UnionSet.length+"]");
                console.log("Jaccard distance based on hash:"+(1-intersectionSet.length/UnionSet.length));
                console.log("--------------------------------------------------------------------------------------");

            }else {
                try{
                    console.log("query returned unexpected results for version"+docs[0].source+docs[0].version);
                }catch(err){
                    console.log("err................................");
                }



            }

        });

    }



});
