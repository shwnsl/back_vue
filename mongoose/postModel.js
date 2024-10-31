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
    id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  thumbIndex: { type: Number, required: true },
  category: { type: String, required: true },
  movieID: { type: Number, required: false },
  text: { type: String, required: true },
  images: {
    type: [
      {
        index: { type: Number, required: true },
        imageURL: { type: String, required: true },
        alt: { type: String, required: false },
      },
    ],
    required: false,
  },
  comments: [
    {
      id: { type: Number, required: true },
      userId: { type: Number, required: true }, 
      commentText: { type: String, required: true }, 
      date: { type: String, required: true },
      time: { type: String, required: true }, 
    },
  ],
  likes: [{ type: Number }],
  author: { type: Object, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Post', postSchema);