var mongoose = require('mongoose');
var DuplicateSchema = new mongoose.Schema({
    _id: {
        firstField: {
            type: String,
            required: true
        }
    },
    uniqueIds: {
        type: [String],
        required: false
    },
    uniqueLibIds: {
        type: [String],
        required: false
    },
    count:{
        type: Number,
        required: true
    }
},{ collection : 'duplicate' });
module.exports = mongoose.model('duplicate', DuplicateSchema);