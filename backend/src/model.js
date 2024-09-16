const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
    commentId: {
        type: String,
        required: [true, 'id required']
    },
    author: {
        type: String,
        required: [true, 'Username  required']
    },
    date: Date,
    text: String
})
const articleSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: [true, 'id required']
    },
    author: {
        type: String,
        required: [true, 'Username required']
    },
    img: String,
    date: Date,
    text: String,
    comments: [commentSchema]
})


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username required']
    },
    salt: String,
    hash: String,
    third_party_id: String,
    auth: []
})

const profilesSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username required']
    },
    headline: String,
    following: [String],
    email: String,
    zipcode: String,
    avatar: String,
    dob: Number
})


exports.Article = mongoose.model('article', articleSchema)
exports.Comment = mongoose.model('comment', commentSchema)
exports.User = mongoose.model('users', userSchema)
exports.Profiles = mongoose.model('profiles', profilesSchema)