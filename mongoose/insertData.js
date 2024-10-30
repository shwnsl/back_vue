const mongoose = require('mongoose');
const Post = require('./postModel'); 
const postData = require("../../NFE1-2-3-fillog/src/datas/postData.json");

// 해당 파일 실행시 임시 포스트데이터 DB에 저장됨

mongoose.connect('mongodb://localhost:27017')
.then(() => {
    console.log("MongoDB 연결 성공");
    return insertPosts(); 
})
.catch(err => {
    console.error("MongoDB 연결 오류:", err);
});

async function insertPosts() {
    try {
      for (const postEntry of postData) {
        const post = new Post(postEntry);

        await post.save();
        console.log('포스트 저장 성공', post);
      }
    } catch (error) {
        console.error('포스트 저장 중 오류 발생', error);
    } finally {
        mongoose.connection.close(); 
    }
}