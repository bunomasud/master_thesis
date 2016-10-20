var Resource = require('resourcejs');
module.exports = function (app, route) {

    // Setup the controller for REST;
    Resource(app, '', route, app.models.version).rest();

    // Return middleware.
    return function (req, res, next) {
        next();
    };
};
