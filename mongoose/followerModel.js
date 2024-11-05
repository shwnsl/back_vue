const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    followers: [
        {
            user: {
                type: Number,
                ref: 'Users',
            }
        }
    ]
});

module.exports = mongoose.model('Follow', followSchema);