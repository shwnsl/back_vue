const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    writtenUser: {
        isUser: Boolean,
        userID: String,
        userName: {
            type: String,
            required: true
        },
        userImage: String,
        password: String
    },
    text: String,
    replies: [
        {
            type: Object,
            ref: 'GuestbookReply'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'guestbooks' });

module.exports = mongoose.model('Guestbook', guestSchema);