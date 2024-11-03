const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    replyTarget: String, // 'article', 'reply'로 구분
    userID: String,
    userName: String,
    password: String,
    replyText: String,
    reReply: [
        {
            type: Object,
            ref: 'ReReply'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'replies' });

module.exports = mongoose.model('Reply', replySchema);