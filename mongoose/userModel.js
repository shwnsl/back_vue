const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
    },
    id: { 
        type: Number, 
        required: true,
    },
    account: { 
        type: String, 
        required: true,
    },
    password: { 
        type: String, 
        required: true 
    },
    userName: { 
        type: String, 
        required: true 
    },
    userImage: {type: String},
    commentedArticles: [String],
    dateCreated: { 
        type: Date, 
        default: Date.now 
    },
    followers: [
        {
            follow: {
                type: Number,
                ref: "Follower"
            }
        }
    ]
});

module.exports = mongoose.model('Users', userSchema);