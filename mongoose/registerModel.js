const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  }
});

module.exports = mongoose.model('Register', userSchema);