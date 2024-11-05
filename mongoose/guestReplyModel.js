const mongoose = require('mongoose');

const guestbookReplySchema = new mongoose.Schema({
    targetGuestbook: String,
    replyUserID: String,
    replyText: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GuestbookReply', guestbookReplySchema);