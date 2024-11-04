const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    repliedArticle: String, // 이 댓글이 소속된 포스트의 _id
    replyTarget: { // 댓글 대상
        target: String, // 'article', 'reply'
        targetID: String // 대상의 _id
    },
    userID: String,
    userName: String,
    password: String,
    replyText: String,
    reReplies: [ String ],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'replies' });

module.exports = mongoose.model('Reply', replySchema);