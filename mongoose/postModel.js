const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    // title: {
    //     type: String,
    //     required: true
    // },
    // content: {
    //     type: String,
    //     required: true
    // },
    // category: {
    //     type: String,
    //     required: true
    // },
    // images: {
    //     type: [String], 
    //     required: false
    // },
    // createdAt: {
    //     type: Date,
    //     default: Date.now
    // }
  title: { type: String, required: true },
  thumbIndex: { type: Number },
  category: { type: String, required: true },
  movieID: { type: Number, required: false },
  text: { type: String, required: true },
  images: {
    type: [ String ],
    required: false,
  },
  comments: [
    {
      id: { type: Number },
      userId: { type: Number }, 
      commentText: { type: String }, 
      date: { type: String },
      time: { type: String }, 
    },
  ],
  likes: [{ type: Number }],
  // author: { type: Object, required: true },
  // date: { type: String, required: true },
  // time: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Post', postSchema);