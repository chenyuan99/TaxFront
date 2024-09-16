const mongoose = require("mongoose");
const Profiles = require('./model.js').Profiles
const connectionString = 'mongodb+srv://yc149:Lovelife098!@cluster0.hqe6q.mongodb.net/social?retryWrites=true&w=majority';

const putFollowing = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    const userid = req.params.user
    const username = req.username
    if (!userid) {
        res.status(400).send('no follower')
    }
    Profiles.find({username: userid}, function (err, profiles) {
        if (profiles.length === 0) {
            res.status(400).send('no such user')
        } else {
            Profiles.findOneAndUpdate(
                {username: username},
                {$addToSet: {following: userid}},
                {upsert: true, new: true},
                function (err, profile) {
                })
            Profiles.find({username: username}, function (err, profiles) {
                res.status(200).send({
                    username: username,
                    following: profiles[0].following
                })
            })
        }
    })
}

const getFollowing = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    let userid = req.params.user;
    if (userid === "") {
        userid = req.username;
    }
    Profiles.find({username: userid}, function (err, profiles) {
        if (profiles.length === 0) {
            res.status(400).send("User doesn't exist in database")
            return
        }
        res.status(200).send({username: userid, following: profiles[0].following})
    })
}

const deleteFollowing = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    const userid = req.params.user
    const username = req.username
    if (!userid) {
        res.status(400).send('userid not supplied')
    }
    Profiles.findOneAndUpdate(
        {username: username},
        {$pull: {following: userid}},
        {new: true},
        function (err, profile) {
            if (err) {
                console.log(err)

            }
        })
    Profiles.find({username: username}, function (err, profiles) {
        res.status(200).send({username: username, following: profiles[0].following})
    })
}


module.exports = (app) => {
    app.get('/following/:user?', getFollowing);
    app.put('/following/:user', putFollowing);
    app.delete('/following/:user', deleteFollowing);
}