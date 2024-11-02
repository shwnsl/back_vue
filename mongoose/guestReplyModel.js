const mongoose = require('mongoose');

const guestbookReplySchema = new mongoose.Schema({
    replyUserID: String,
    replyText: String,
    replyDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GuestbookReply', guestbookReplySchema);