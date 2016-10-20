/**
 * Created by rahman on 20.04.2016.
 */
var Resource = require('resourcejs');
module.exports = function (app, route) {

    // Setup the controller for REST;
    Resource(app, '', route, app.models.library).rest();

    // Return middleware.
    return function (req, res, next) {
        next();
    };
};
