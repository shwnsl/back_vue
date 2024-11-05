const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    thumbIndex: { type: Number, required: true },
    category: { type: String, required: true },
    movieID: { type: Number },
    movieGenres: [ Number ],
    text: { type: String, required: true },
    movieGenres: [Number],
    images: {
        index: true,
        type: [
            {
                imageURL: { type: String, required: true },
                alt: { type: String, required: false },
            },
        ],
        required: false,
    },
    comments: [ String ], // replies의 _id 배열
    likes: [ String ], // users의 _id 배열 (users가 liked한 배열에도 마찬가지로 해당 글의 _id를 추가해야 함)
    author: { type: String, required: true }, // users의 _id
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', postSchema);