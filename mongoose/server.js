const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({path: '../.env'});
const app = express();
const upload = multer({ dest: 'uploads/' }); 

// JWT 비밀키를 환경변수에서 가져오기
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'default_secret_key';

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// body-parser에 요청 본문 크기 제한 설정
app.use(bodyParser.json({ limit: '10mb' })); // 10MB로 설정
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const db = require("./model");
const Post = require('./postModel');
const User = require('./registerModel');
db.main();

app.get("/", (req, res) => {
    res.json({ message: "connected" })
})


// 회원가입 라우트
app.post('/register', upload.single('userImage'), async (req, res) => {
    const { type, account, password, userName, commentedArticles } = req.body;
    const userImage = req.file;
  
  
  
    try {
      if (!account || !password || !userName) {
        return res.status(400).json({ message: '필수 정보를 입력해주세요.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: '비밀번호는 8자리 이상이어야 합니다.' });
      }
  
       // 이메일 중복 확인
      const email = await User.findOne({ account });
      if (email) {
        return res.status(400).json({ message: '이미 등록된 이메일입니다.' }); // 이메일 중복 에러 메시지
      }
  
      // 비밀번호 암호화
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 새로운 유저 생성
      const newUser = new User({
        type,
        account,
        password: hashedPassword, // 비밀번호 암호화
        userName,
        userImage: userImage ? userImage.path : null,
        commentedArticles,
      });
  
      await newUser.save(); // 데이터베이스에 유저 저장
  
      res.status(200).json({ message: '회원가입이 완료되었습니다!' });
    } catch (error) {
      if(error.name == 'MongoNetworkError') {
        return res.status(500).json({ message: '데이터베이스 연결에 실패했습니다.' });
      }
      res.status(500).json({ message: '회원가입 중 서버 오류가 발생했습니다.' });
    }
  });


// 로그인 라우트
app.post('/login', async (req, res) => {
    try {
      const { account, password } = req.body;
  
      // 유저 찾기
      const user = await User.findOne({ account });
  
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
  
      // 비밀번호 비교
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
      }

      // 비밀번호가 일치하면 JWT 토큰 발급
      const token = jwt.sign(
        { id: user._id, account: user.account }, // 토큰에 포함할 사용자 정보 (Payload)
        SECRET_KEY,                             // 비밀키를 사용해 서명
        { expiresIn: '1h' }                     // 토큰 유효기간 (1시간)
      );
  
      // 로그인 성공, 실패
      res.json({ message: '로그인 성공', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: '로그인 실패' });
    }
  });


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