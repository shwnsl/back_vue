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
        const { userAccount, userPassword } = req.body;

        // 유저 찾기
        const user = await Users.findOne({ account: userAccount });

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 비밀번호 비교
        const isMatch = await bcrypt.compare(userPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호가 일치하면 JWT 토큰 발급
        const token = jwt.sign(
            { id: user._id, account: user.userAccount }, // 토큰에 포함할 사용자 정보 (Payload)
            SECRET_KEY, // 비밀키를 사용해 서명
            { expiresIn: '1h' } // 토큰 유효기간 (1시간)
        );

        // 로그인 성공, 실패
        res.json({ user, token });

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
    const { title, category, movieID, text, images, author } = req.body;

    try {
        const newPost = new Post({
            title,
            thumbIndex: 0,
            category: Number(category),
            movieID,
            text,
            images: images,
            author
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
    const postId = req.params.postId;
    const { userId } = req.body

    try {
        const post = await Post.findOne({ _id: postId });
        if (!post) {
            return res.status(404).json({message : "포스트를 찾을 수 없습니다."})
        }

        const user = await Users.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
        }

        // likedArticles가 존재하지 않으면 생성
        if (!user.likedArticles) {
            user.likedArticles = [];
        }
        const alreadyLiked = user.likedArticles.includes(postId);

        if (!alreadyLiked) {
            post.likes += 1;
            user.likedArticles.push(postId);
            await post.save();
            await user.save();
            return res.json({message: '좋아요 추가 성공', post})
        } else {

            post.likes -= 1;
            user.likedArticles = user.likedArticles.filter(id => id !== postId);
            await post.save();
            await user.save();
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
  const { title, text, category, images } = req.body;
  try {
      const editPost = await Post.findByIdAndUpdate(
          id,
          { title, text, category, images },
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

app.get('/replies/:id', async (req, res) => { // 댓글 가져오기
    try {
        const replies = await Reply.findById(req.params.id); // 포스트에서 아이디 가져오기

        res.json(replies);
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

app.get('/replies/post/:id', async (req, res) => { // 포스트에 해당되는 댓글 가져오기
    try {
        const replies = await Reply.find({ repliedArticle: req.params.id });

        res.json(replies);
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

app.post('/reply/:postID', async (req, res) => { // 댓글, 대댓글 작성
    const postID = req.params.postID;
    const { replyTarget, userID, userName, password, replyText, reReplies } = req.body;

    console.log(replyTarget)

    try {
        const post = await Post.findById(postID);
        const targetReply = replyTarget.target === 'reply' ? await Reply.findById(replyTarget.targetID) : null;

        if (!post) {
            return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
        }

        const user = await Users.findById(userID);

        if (!user) console.log('유저가 존재하지 않습니다.');

        // commentedArticles가 존재하지 않으면 생성
        if (user && !user.commentedArticles) {
            user.commentedArticles = [];
        }

        const newComment = new Reply({
            replyTarget: replyTarget,
            repliedArticle: postID,
            userID: userID,
            userName: userName,
            password: password ?? null,
            replyText: replyText,
            reReplies: reReplies
        });

        const savedComment = await newComment.save();

        console.log('저장된 댓글 :', savedComment);
        post.comments.push(newComment._id);

        // 사용자가 이 포스트에 대한 첫 댓글이라면 userModel의 commentedArticles에 postId 추가
        if (user && !user.commentedArticles.includes(postID)) {
            user.commentedArticles.push(postID);
        }

        if (replyTarget.target === 'reply') {
            targetReply.reReplies.push(savedComment._id);

            await targetReply.save();
        }

        await post.save();
        if (user) await user.save();

        return res.status(200).json({ message: 'Reply Attached Successfully' });
    } catch (error) {
        console.error('댓글 추가 중 오류:', error.message);
        res.status(500).json({ message: '댓글 추가 중 오류가 발생했습니다.' });
    }
});

app.delete('/reply/:replyID', async (req, res) => { // 댓글 삭제
    const replyID = req.params.replyID;
    const postID = req.body.postID;
    const inputPassword = req.body.password;

    try {
        const post = await Post.findById(postID);
        const replyToDelete = await Reply.findById(replyID);
        const isReplyExist = post.comments.find(reply => reply === replyID);

        console.log(replyToDelete)
        console.log(inputPassword);

        if (!post) {
            return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
        }

        if (!!isReplyExist === false) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (replyToDelete) {
            if (replyToDelete.password !== inputPassword) {
                return res.status(403).json({ message: '비밀번호가 일치하지 않습니다.' });
            }
        } else {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        post.comments.filter(reply => reply !== replyID); // 대상 댓글이 존재하는 Post 의 comment 배열에서 해당 댓글 제거

        await post.save();
        await Reply.findByIdAndDelete(replyID);

        return res.status(200).json({ message: '댓글이 삭제되었습니다.', post });
    } catch (error) {
        res.status(500).json({ message: '댓글 삭제 중 오류가 발생했습니다.' });
    }
});

app.get('/guestbooks', async (req, res) => { // 방명록 가져오기
    try {
        const guestbookList = await Guestbook.find();

        res.json(guestbookList.sort((a, b) => { return b.createdAt - a.createdAt }));
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

app.delete('/guestbooks/:id', async (req, res) => { // 방명록 글 삭제
    try {
        await Guestbook.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Guestbook Removed Successfully' });
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

app.post('/guestbooks/reply/:id', async (req, res) => { // 방명록 답글 작성 - 미완성
    try {
        const newGuestbookReply = new GuestbookReply(req.body);
        const targetGuestbook = Guestbook.findByIdAndUpdate(req.params.id, targetGuestbook.replies.push(newGuestbookReply._id));

        await newGuestbookReply.save();

        res.status(200).json({ message: 'Guestbook Reply Attached Successfully' });
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

app.get('/guestbooks/replies/:id', async (req, res) => { // 방명록 글의 전체 답글 가져오기
    try {
        const replies = await GuestbookReply.find({ targetGuestbook: req.params.id });

        res.json(replies);
    } catch(error) {
        res.status(500).json({ message: 'An error occurred' });
    }
});

// 마이페이지
app.get('/mypage', async(req,res) => {
  const { account } = req.body;

  try{
    const findUser = await Users.findOne( account );
    console.log('유저 찾기 성공: ', findUser)
    // res.json(findUser)
    if (!findUser) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다' });
    }
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
app.post('/mypage/edit', upload.single('userImage'), async(req,res)=>{
  const {_id, userName, account} = req.body;
  const userImage = req.file ? req.file.path : null;
  try{
    const updatedUser = await Users.findOneAndUpdate(
      { _id: _id },
      { userName, userImage, account },
      { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다' });
    }
    res.json({
      _id: updatedUser._id,
      account: updatedUser.account,
      userName: updatedUser.userName,
      userImage: updatedUser.userImage,
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
app.post('/users/:userId/follow', async (req, res, next) => {
    const { userID, followerID } = req.body;

    try {
        const updatedUser = await Users.findByIdAndUpdate(
            userID,
            { $push: { followers: { follower: followerID } } },
            { safe: true, upsert: true, new: true}
        );

        const updatedFollower = await Follow.findByIdAndUpdate(
            followerID,
            { $push: { users: { user: userID } } },
            { safe: true, upsert: true, new: true}
        );
        const userWithFollowers = await Users.findById(userID).select('followers');
        console.log('Updated followers:', userWithFollowers.followers);

        res.status(200).json({ user: updatedUser, follower: updatedFollower });
    } catch (error) {
        next(error)
    }
});

// 언팔로우 기능
app.post('/users/:userId/unfollow', async (req, res, next) => {
    const { userID, followerID } = req.body;

    try {
        const updatedUser = await Users.findByIdAndUpdate(
            userID,
            { $pull: { followers: { follower: followerID } } },
            { safe: true, upsert: true, new: true}
        );

        const updatedFollower = await Follow.findByIdAndUpdate(
            followerID,
            { $pull: { users: { user: userID } } },
            { safe: true, upsert: true, new: true}
        );

        res.status(200).json({ user: updatedUser, follower: updatedFollower });
    } catch (error) {
        next(error)
    }
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