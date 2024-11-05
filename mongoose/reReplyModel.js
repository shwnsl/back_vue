const mongoose = require('mongoose');

const reReplySchema = new mongoose.Schema({
    userID: String,
    userName: String,
    password: String,
    replyText: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ReReply', reReplySchema);