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
    userImage: { type: String },
    likedArticles: [ String ], // 좋아요 한 게시물의 _id 배열
    commentedArticles: [ String ], // 댓글 작성한 게시물의 _id 배열
    followers: [], // 팔로우 한 사용자의 _id 배열
    blogSettings: { // blogSettings 객체로 관련 설정 통합 - admin 사용자일 경우에만 필요하고, 일반 사용자는 단순 null 처리
        blogName: String,
        favoriteGenres: [ Number ],
        blogCategories: [
            {
                id: Number,
                categoryName: String
            }
        ]
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
}, { collection: 'users' });

module.exports = mongoose.model('Register', userSchema);