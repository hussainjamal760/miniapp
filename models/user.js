const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://hussain:hussain123@cluster0.s2tqmlt.mongodb.net/") .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

const userSchema = mongoose.Schema({
    username:String,
    name:String,
    email:String,
    password:String,
    profilepic:{type :String  , default :"default.png"},
    posts:[{type : mongoose.Schema.Types.ObjectId, ref : 'post'}]
})

module.exports = mongoose.model('user' ,userSchema )