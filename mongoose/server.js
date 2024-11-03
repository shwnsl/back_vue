const express = require('express')
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');

const { ObjectId } = mongoose.Types;

// --- 여기서부터 데이터 모델 등록 ---

const db = require('./model');
const User = require('./registerModel');
const Users = require('./userModel');
const Post = require('./postModel');
const Reply = require('./replyModel');
const ReReply = require('./reReplyModel');
const Guestbook = require('./guestModel');
const GuestbookReply = require('./guestReplyModel');
const Follow = require('./followerModel');

dotenv.config({path: '../.env'});

const app = express();
const upload = multer({ dest: 'uploads/' });

// JWT 비밀키를 환경변수에서 가져오기
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'default_secret_key';

app.use(cors({
    origin: 'http://localhost:5173',
    methods: [ 'GET', 'POST', 'PUT', 'DELETE' ],
    allowedHeaders: [ 'Content-Type', 'Authorization' ],
    credentials: true
}));

// body-parser에 요청 본문 크기 제한 설정
app.use(bodyParser.json({ limit: '10mb' })); // 10MB로 설정
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static('uploads'));


db.main();

app.get('/', (req, res) => {
    res.json({ message: 'Connected!' })
});

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
    } catch(error) {
        if (error.name == 'MongoNetworkError') {
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
            SECRET_KEY, // 비밀키를 사용해 서명
            { expiresIn: '1h' } // 토큰 유효기간 (1시간)
        );

        // 로그인 성공, 실패
        res.json({ message: '로그인 성공', token });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: '로그인 실패' });
    }
});


// 토큰 검증 미들웨어
const tokenMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401); // 토큰이 없을 경우

    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) return res.sendStatus(403); // 토큰이 유효하지 않을 경우

        try{
            // 토큰에 포함된 사용자 ID를 이용하여 DB에서 사용자 정보 조회
            const user = await User.findById(decoded.id);
            if (!user) return res.sendStatus(404); // 사용자를 찾을 수 없을 경우
            req.user = user; // 요청 객체에 사용자 정보 추가
            next();
        } catch(error) {
            res.status(500).json({ message: '서버 오류 발생' });
        }
    });
};

 // 토큰을 이용해 사용자 정보 가져오기
app.get('/profile', tokenMiddleware, async (req, res) => {
    try {
        res.json(req.user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '사용자 정보 조회 실패' });
    }
});

// 글쓰기
app.post('/post', async (req, res) => {
    const { title, content, category, images } = req.body;

    try {
        const newPost = new Post({
            title,
            content,
            category,
            images
        });

        await newPost.save();
        res.status(200).json({ message: 'Post saved Successgully' });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Post failed' });
    }
});

// 게시글 목록
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find();

        res.json(posts.sort((a, b) => { return b.createdAt - a.createdAt }));
    } catch(error) {
        res.status(500).json({ message: 'Failed bring posts' });
    }
});

// 게시글 상세
app.get('/posts/:id', async(req, res) => {
    const { id } = req.params;

    try {
        const post = await Post.findOne({ _id: id });

        if (!post) {
            return res.status(404).json({ message: "포스트를 찾을 수 없음" });
        }

        res.json(post);
    } catch(error) {
        res.status(500).json({ message: 'failed to find', error: error.message });
    }
})

// 게시글 좋아요
app.post('/posts/:postId/like', async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body

    try {
        // db에서 포스트 찾기
        const post = await Post.findOne({ _id: postId });
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
    } catch(error) {
        console.error(error);
        res.status(500).json({message: '좋아요 중 오류 발생'})
    }
});

// 게시글 수정
app.put('/posts/:id', async(req, res) => {
    const { id } = req.params;
    const { title, content, category, images } = req.body;

    try {
        const editPost = await Post.findByIdAndUpdate(
            id,
            { title, content, category, images },
            { new: true }
        );

        res.json({ message: 'Post edited' });
    } catch(error) {
        res.status(500).json({ message: 'Edit failed' });
    }
});

// 게시글 삭제
app.delete('/posts/:id', async(req, res) => {
    const { id } = req.params;

    try {
        await Post.findByIdAndDelete(id);

        res.json({ message: 'Post deleted' });
    } catch(error) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

app.post('/reply', async (req, res) => { // 댓글 작성 (진행중)
    const {  } = req.body;

    try {
        const newReply = new Reply({  });
        const replyTarget = Post.findById() // 대상 게시물 찾기

        await newReply.save(); // 댓글 저장
        await replyTarget.findByIdAndUpdate(); // 대상 게시물의 댓글 배열에 작성된 댓글의 ID 업데이트

        res.status(200).json({ message: 'Reply saved Successgully' });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Reply failed' });
    }
});

app.post('/re-reply', async (req, res) => { // 대댓글 작성 (진행중)
    const {  } = req.body;

    try {
        const newReply = new Reply({  });
        const replyTarget = Reply.findById() // 대상 댓글 찾기

        await newReply.save(); // 댓글 저장
        await replyTarget.findByIdAndUpdate(); // 대상 댓글의 댓글 배열에 작성된 댓글의 ID 업데이트

        res.status(200).json({ message: 'Reply saved Successgully' });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Reply failed' });
    }
});

app.get('/replies/:id', async (req, res) => { // 댓글 가져오기
    try {
        const replies = await Reply.findById(req.params.id); // 포스트에서 아이디 가져오기

        res.json(replies);
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

app.get('/re-replies/:id', async (req, res) => { // 대댓글 가져오기
    try {
        const reReplies = await ReReply.findById(req.body.reReplyID);

        res.json(reReplies.sort((a, b) => { return b.createdAt - a.createdAt }));
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

app.get('/guestbooks', async (req, res) => { // 방명록 가져오기
    try {
        const guestbookList = await Guestbook.find();

        res.json(guestbookList.sort((a, b) => { return b.writtenDate - a.writtenDate }));
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

app.post('/guestbooks/write', async (req, res) => { // 방명록 작성
    const { isUser, userID, userName, userImage, password, text } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newGuestbook = new Guestbook({
            writtenUser: {
                isUser,
                userID,
                userName,
                userImage,
                hashedPassword,
            },
            text
        });

        await newGuestbook.save();

        res.status(200).json({ message: 'Guestbook Posted Successfully' });
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

app.post('/guestbooks/reply/:id', async (req, res) => { // 방명록 답글 작성 - 미완성
    const {} = req.body;

    try {
        const targetGuestbook = Guestbook.findById(req.params.id);
        const newGuestbookReply = new GuestbookReply({});

        await newGuestbookReply.save();

        res.status(200).json({ message: 'Guestbook Reply Attached Successfully' });
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

// 마이페이지
app.post('/mypage', async(req,res) => {
  console.log(req.body)
  const { userAccount } = req.body;
  try{
    const findUser = await User.findOne({ account: userAccount });
    console.log("Query result:", findUser);
    if (!findUser) {
      console.log('유저를 찾을 수 없습니다');
      return res.status(404).json({ message: '유저를 찾을 수 없습니다' });
    }
    console.log('유저 데이터 찾기 성공')

    res.json({
      _id: findUser._id,
      account: findUser.account,
      userName: findUser.userName,
      userImage: findUser.userImage,
      commentedArticles: findUser.commentedArticles,
    })
  } catch (error) {
      console.error("Error details:", error);
      res.status(500).json({ message: '유저 찾기 실패' });
  }
})

// 내 정보 수정
app.post('/mypage/edit',async(req,res)=>{
  console.log(req.body);
  const {_id,userName,userImage,account} = req.body;
  try{
    const updatedUser = await User.findOneAndUpdate(
      { _id: _id },
      { userName, userImage, account },
      { new: true });
    console.log('DB에서 찾은 결과: ', updatedUser)
    if (!updatedUser) {
      console.log('유저를 찾을 수 없습니다');
      return res.status(404).json({ message: '유저를 찾을 수 없습니다' });
    }
    console.log('유저 데이터 찾기 성공')
    res.json({
      _id: updatedUser._id,
      account: updatedUser.account,
      userName: updatedUser.userName,
      userImage: updatedUser.userImage,
      commentedArticles: updatedUser.commentedArticles,
    })
  }catch (error){
    res.status(500).json({ message: '유저 정보 수정 실패', error });
  }
})

app.get('/users', async (req, res) => { // 전체 사용자 목록 가져오기
    try {
        const users = await Users.find();

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'failed bring users' })
    }
});

app.get('/user-info/:id', async (req, res) => { // 개별 사용자 정보 가져오기
    try {
        const user = await Users.findById(req.params.id);

        res.json(user);
    } catch(error) {
        res.status(500).json({ message: 'Failed bring user' });
    }
})

// 팔로우 기능
app.post('/users/:userId/follow', async (req, res) => {
    const userID = req.body.userID;
    const followerID = req.body.followerID;

    Users.findByIdAndUpdate(userID, { $push: { followers: { follower: followerID } } }, { safe: true, upsert: true, new: true })
    .then(result => {
        return Follow.findByIdAndUpdate(
            followerID,
            { $push: { users: { user: userID } } },
            { safe: true, upsert: true, new: true },
        );
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        next(err);
    });
});

// 언팔로우 기능
app.post('/users/:userId/unfollow', async (req, res) => {
    const userID = req.body.userID;
    const followerID = req.body.followerID;

    Users.findByIdAndUpdate(userID, { $pull: { followers: { follower: followerID } } }, { safe: true, upsert: true, new: true })
    .then(result => {
        return Follow.findByIdAndUpdate(
            followerID,
            { $pull: { users: { user: userID } } },
            { safe: true, upsert: true, new: true },
        );
    })
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        next(err);
    });
});

app.get('/admin-info', async (req, res) => {
    try {
        // type이 "admin"인 첫 번째 사용자를 찾습니다.
        const admin = await Users.findOne({ type: 'admin' });

        if (!admin) {
            return res.status(404).json({ message: '관리자를 찾을 수 없습니다.' });
        }

        // 관리자 이름과 이미지 경로 반환
        res.json({
            adminID: admin._id,
            adminName: admin.userName,
            adminImage: admin.userImage,
            followers: admin.followers,
            blogInfo: admin.blogSettings
        });
    } catch (error) {
        console.error('관리자 정보 가져오기 실패(서버):', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${ PORT }.`);
});