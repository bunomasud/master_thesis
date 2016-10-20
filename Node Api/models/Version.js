var mongoose = require('mongoose');

// Create the versionschema.
var VersionSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: false
    },
    version: {
        type: [String],
        required: true
    },
    url: {
        type: String,
        required: true,
		index: { unique: true }
    },
    md5: {
        type: String,
        required: true,
        index: true
    },
    AST:{
        type:  mongoose.Schema.Types.ObjectId,
        required: false
    },
    error:{
        type: String,
        required: false
    },
    hash: {
        type: [String],
        required: false
    },
    funcExpressionHashSet: {
        type: [String],
        required: false
    },
    funcDeclarationHashSet: {
        type: [String],
        required: false
    },
    callExpressionHashSet: {
        type: [String],
        required: false
    },
    funcExpressionHashSetLength: {
        type: Number,
        required: false,
        index: true
    },
    funcDeclarationHashSetLength: {
        type: Number,
        required: false,
        index: true
    },
    callExpressionHashSetLength: {
        type: Number,
        required: false,
        index: true
    },
	tokenHashSet: {
        type: [String],
        required: false
    },
	tokensHashSetLength: {
        type: Number,
        required: false,
        index: true
    },
    source:{
        type: String,
        required: false
    },
    original:{// Marks if the file is original for itself or being copied from another library
        type: Boolean,
        required: false,
        index: true
    },
    significant:{// Marks if the file is good for detecting version number, false if it is copied into multiple version
        type: Boolean,
        required: false,
        index: true
    },
    tokenisedMD5:{
        type: String,
        required: false,
        index: true
    },
    library: { type:mongoose.Schema.ObjectId, ref:"library"}

    //Tokens: mongoose.Schema.Types.Mixed,

});

VersionSchema.index({ funcExpressionHashSetLength: 1, funcDeclarationHashSetLength: 1,callExpressionHashSetLength:1,tokensHashSetLength:1,original:1,significant:1});
// Export the model.
module.exports = mongoose.model('version', VersionSchema);
