const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors({
    credentials: true, origin: "http://localhost:5173"
}));

// body-parser에 요청 본문 크기 제한 설정
app.use(bodyParser.json({ limit: '10mb' })); // 10MB로 설정
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());

const db = require("./model");
const Post = require('./postModel');
// const User = require('./userModel')
const mongoose = require("mongoose");
db.main();

app.get("/", (req, res) => {
    res.json({ message: "connected" })
})

// 글쓰기
app.post("/post", async(req,res) => {
    const { title, content, category, images } = req.body;

    try {
        const newPost = new Post({
            title,
            content,
            category,
            images
        });
        await newPost.save();
        res.status(200).json({ message: 'Post saved Successgully' })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Post failed' })
    }
})

// 게시글 목록
app.get("/posts", async(req,res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'failed bring posts' })
    }
})

// 게시글 상세
app.get("/posts/:id", async(req,res) => {
    const { id } = req.params;
    console.log('포스트 찾기')
    try {
         const postId = parseInt(id);
        const post = await Post.findOne({ id: id }); 
        if (!post) {
          return res.status(404).json({ message: "포스트를 찾을 수 없음" });
        }
         console.log("찾은 포스트:", post); 
        res.json(post); 
    } catch (err) {
        res.status(500).json({ message: 'failed to find', error: err.message })
    }
})

// 게시글 좋아요
app.post("/posts/:postId/like", async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body 
    console.log("요청 params:", req.params);
    console.log("요청 body:", req.body);
    try {
        // db에서 포스트 찾기
        const post = await Post.findOne({ id: postId });
        if (!post) {
            return res.status(404).json({message : "포스트를 찾을 수 없습니다."})
        }
        // 이미 좋아요를 눌렀는지 확인
        if (!post.likes.includes(userId)) {
            post.likes.push(userId) // id를 좋아요 배열에 추가
            await post.save();  // db 변경 사항 저장
            return res.json({message: '좋아요 추가 성공', post})
        } else {
            // 좋아요 취소
            post.likes = post.likes.filter(like => like !== userId); // 좋아요 제거
            await post.save();  // db 변경 사항 저장
            return res.json({ message: '좋아요 취소 성공', likes: post.likes });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message: '좋아요 중 오류 발생'})
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});