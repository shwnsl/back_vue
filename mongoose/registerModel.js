const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  type: { 
    type: String, 
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
  blogName: { 
    type: String,
    require: false}, // blogName 필드 추가
  tags: [{ 
    type: String,
    required: false
   }]    // tags 필드 추가 (배열 형태)
});

module.exports = mongoose.model('Register', userSchema);