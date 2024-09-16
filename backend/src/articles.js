const md5 = require('md5')
const mongoose = require("mongoose");
const Article = require('./model.js').Article
const Comment = require('./model.js').Comment
const connectionString = 'mongodb+srv://yc149:Lovelife098!@cluster0.hqe6q.mongodb.net/social?retryWrites=true&w=majority';

function isNumber(n) {
    return !isNaN(parseFloat(n)) && !isNaN(n - 0);
}

const getArticles = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    console.log(req.username)
    if (req.params.id && !isNumber(req.params.id)) {
        Article.find({author: req.params.id}, function (err, articles) {
            if (articles === undefined || articles.length === 0) {
                res.status(401).send("Article not found!");
            } else {
                res.status(200).send({"articles": articles})
            }
        })
    } else if (req.params.id && isNumber(req.params.id)) {
        Article.find({id: req.params.id}, function (err, articles) {
            if (articles === undefined || articles.length === 0) {
                res.status(401).send("Article not found!");
            } else {
                res.status(200).send({"articles": articles})
            }
        })
    } else {
        Article.find({author: req.username}, function (err, articles) {
            res.status(200).send({articles: articles})
        })
    }
}


const postArticles = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    let postID;
    Article.find({}, function (err, articles) {
        postID = articles.length;
        if (!req.body.text) {
            res.status(400).send("Miss text");
        } else {
            let newarticle = new Article({
                date: new Date(),
                text: req.body.text,
                author: req.username,
                img: "",
                comments: [],
                id: postID
            })
            newarticle.save();
            articles.unshift(newarticle);
            res.status(200).send({articles: articles})
        }
    })
}


const putArticles = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    if (!req.params.id) {
        res.status(400).send('id missing')
        return
    }
    Article.find({id: req.params.id}, function (err, articles) {
        if (articles === undefined || articles.length === 0) {
            res.status(401).send("artilce id missing")
            return
        }
        if (req.body.commentId == "-1") {
            var commentid = md5(req.username + new Date().getTime())
            var newComment = new Comment({
                commentId: commentid,
                author: req.username,
                date: new Date(),
                text: req.body.text
            })
            new Comment(newComment).save()
            Article.findOneAndUpdate(
                {id: req.params.id},
                {$push: {comments: newComment}},
                {new: true},
                function (err, articles) {
                    res.status(200).send({articles: articles});
                })
            return
        }
        if (!req.body.commentId) {
            if (articles[0].author !== req.username) {
                res.status(401).send("You are not author")
                return
            }
            Article.findOneAndUpdate(
                {id: req.params.id},
                {$set: {text: req.body.text}},
                {new: true},
                function (err, articles) {
                    res.status(200).send({articles: articles})
                })

        } else {
            Comment.find({commentId: req.body.commentId}, function (err, comments) {
                if (comments.length === 0) {
                    res.status(401).send("wrong comment id")
                    return
                }

                if (comments[0].author !== req.username) {
                    res.status(401).send("comment is not owned")
                    return
                }
                Comment.updateMany(
                    {commentId: req.body.commentId},
                    {$set: {text: req.body.text}},
                    {new: true},
                    function (err, comments) {
                        if (err) {
                            // console.log(err)

                        }
                    })
                Article.updateMany(
                    {_id: req.params.id, 'comments.commentId': req.body.commentId},
                    {$set: {'comments.$.text': req.body.text}},
                    {new: true},
                    function (err, articles) {
                        if (err) {
                            // return console.log(err)
                        }
                    })
                Article.find({id: req.params.id}, function (err, articles) {
                    res.status(200).send({articles: articles})
                })
            })
        }
    })
}

module.exports = (app) => {
    app.get('/articles/:id?', getArticles);
    app.put('/articles/:id', putArticles);
    app.post('/article', postArticles);
}