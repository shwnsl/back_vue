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

const db = require("./model");
const Post = require('./postModel');
db.main();

app.get("/", (res) => {
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
    try {
        const post = await Post.findById(id);
        res.json(post); 
    } catch (err) {
        res.status(500).json({ message: 'failed to find' })
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});