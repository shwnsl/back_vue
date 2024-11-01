const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    followers: [
        {
            user: {
                type: Number,
                ref: "Users",
            }
        }
    ]
});

module.exports = mongoose.model('Follow', followSchema);