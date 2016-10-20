/**
 * Created by rahman on 20.04.2016.
 */
var mongoose = require('mongoose');


// Create the LibrarySchema.
var LibrarySchema = new mongoose.Schema({

    libName: {
        type: String,
        required: true
    },
    latest: {
        type: String,
        required: false
    },
    homepage: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    versions: [{type: mongoose.Schema.Types.ObjectId, ref: 'version',required: false}]// mongoose.Schema.Types.Mixed

});

// Export the model.
module.exports = mongoose.model('library', LibrarySchema);
