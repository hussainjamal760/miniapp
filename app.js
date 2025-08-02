const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path')
const upload = require("./config/multerConfig");
const PORT = process.env.PORT || 3000;


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname , "public")))
app.use(cookieParser());

app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    const data = jwt.verify(token, 'shhhh');
    req.user = data;
    res.locals.user = data; // makes user available in EJS
  } else {
    res.locals.user = null;
  }
  next();
});

app.get('/profile/upload' , (req , res)=>{
  res.render('profileupload')
})

app.post('/upload' , isLoggedIn , upload.single('image') ,async  (req , res)=>{
  let user = await  userModel.findOne({email : req.user.email})
  user.profilepic = req.file.filename
  await user.save()
  res.redirect('/profile')
})

// Home
app.get('/', (req, res) => {
  res.render('index');
});

// Register
app.post('/register', async (req, res) => {
  const { username, name, email, password, age } = req.body;

  const user = await userModel.findOne({ email });
  if (user) return res.send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const user = await userModel.create({
        username,
        email,
        name,
        age,
        password: hash,
      });

      const token = jwt.sign({ email: email, userid: user._id }, 'shhhh');
      res.cookie('token', token);
      res.redirect('/profile');
    });
  });
});


// Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Login Handler
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) return res.send("Invalid credentials");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      const token = jwt.sign({ email: email, userid: user._id }, 'shhhh');
      res.cookie('token', token);
      res.redirect('/profile');
    } else {
      res.redirect('/login');
    }
  });
});

// Profile
app.get('/profile', isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email }).populate('posts');
  res.render('profile', { user });
});

//Post
app.post('/post', isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email });
  let {content} = req.body
  
  let post = await postModel.create({
    user : user._id,
    content,
  })

  user.posts.push(post._id)
  await user.save()
  res.redirect('/profile')

});

// Logout
app.get('/logout', (req, res) => {
  res.cookie('token' , "");
  res.redirect('/login');
});

app.get("/like/:id" , isLoggedIn , async (req ,res)=>{
    let post = await postModel.findOne({_id : req.params.id}).populate("user")

    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid)
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid) , 1)
    }
    await post.save()
    res.redirect('/profile')
})

app.get("/edit/:id" , isLoggedIn , async (req ,res)=>{
    let post = await postModel.findOne({_id : req.params.id}).populate("user")

    res.render('edit' , {post})
})

app.post("/update/:id" , isLoggedIn , async (req ,res)=>{
    let post = await postModel.findOneAndUpdate({_id : req.params.id} , {content : req.body.content})


    res.redirect('/profile')
})

// Middleware
function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  const data = jwt.verify(token, 'shhhh');
  req.user = data;
  next();
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
