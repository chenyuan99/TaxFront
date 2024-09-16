const Profiles = require('./model.js').Profiles
const mongoose = require("mongoose");
const connectionString = 'mongodb+srv://yc149:Lovelife098!@cluster0.hqe6q.mongodb.net/social?retryWrites=true&w=majority';
const uploadImage = require('./uploadCloudinary')

const getHeadline = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    let username = req.params.user
    if (username === "" || username === "undefined" || username === null) {
        username = req.username;
    }
    Profiles.find({username: username}, function (err, profiles) {
        if (profiles.length === 0) {
            res.status(400).send("users missing")
            return
        }
        res.status(200).send({
            username: username,
            headline: profiles[0].headline
        })
    })
}


const putHeadline = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    const username = req.username
    const headline = req.body.headline
    if (!headline) {
        res.status(400).send('Headline missing')
    }

    Profiles.updateMany(
        {username: username},
        {$set: {headline: headline}},
        {new: true},
        function (err, profiles) {
            res.status(200).send({
                username: username, headline: headline
            });
        })

}


const getEmail = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    const username = req.params.user
    if (username === "") {
        uusername = req.username;
    }
    Profiles.find({username: username}, function (err, profiles) {
        if (profiles.length == 0) {
            res.status(400).send("User not found in the database")
            return
        }
        res.status(200).send({
            username: username,
            email: profiles[0].email
        })
    })

}


const putEmail = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    const username = req.username
    const newEmail = req.body.email
    if (!newEmail) {
        res.status(400).send('New email missing')
    }
    Profiles.updateMany(
        {username: username},
        {$set: {email: newEmail}},
        {new: true},
        function (err, profiles) {
            res.status(200).send({
                username: username,
                email: newEmail
            })
        })
}


const getZipcode = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    const username = req.params.user
    Profiles.find({username: username}, function (err, profiles) {
        if (profiles.length == 0) {
            res.status(400).send("User not found in database")
            return
        }
        res.status(200).send({
            username: username,
            zipcode: profiles[0].zipcode
        })
    })
}

const putZipcode = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    const username = req.username
    const newZipcode = req.body.zipcode
    if (!newZipcode) {
        res.status(400).send('zipcode missing')
    }
    Profiles.updateMany(
        {username: username},
        {$set: {zipcode: newZipcode}},
        {new: true},
        function (err, profiles) {
            res.status(200).send({
                username: username,
                zipcode: newZipcode
            })
        })
}


const getDob = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    let username = req.params.user
    Profiles.find({username: username}, function (err, profiles) {
        if (profiles.length == 0) {
            res.status(400).send("User not found in the database")
            return
        }
        const profileObj = profiles[0];
        res.status(200).send({
            username: username,
            dob: profileObj.dob,
        })

    })
}

const getProfile = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    let username = req.username;
    // console.log(username)
    Profiles.find({username: username}, function (err, profiles) {
        if (profiles.length === 0) {
            res.status(400).send("User not found in the database")
            return
        }
        const profileObj = profiles[0];
        res.status(200).send({
            username: username,
            dob: profiles[0].dob,
            avatar: profiles[0].avatar,
            zipcode: profiles[0].zipcode,
            email: profiles[0].email,
            headline: profiles[0].headline
        })

    })
}

const getAvatar = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    var users;
    if (req.params.user != null && req.params.user != "") {
        users = req.params.user.split(',')
    } else {
        users = [req.username];
    }
    Profiles.find({username: {$in: users}}).exec(function (err, profiles) {
        var avatars = []
        if (profiles.length == 0) {
            res.status(400).send("none user is supplied in the database")
            return
        }
        profiles.forEach(r => {
            avatars.push({
                username: r.username,
                avatar: r.avatar
            })
        })
        res.status(200).send({avatars: avatars})
    })
}

const putAvatar = (req, res) => {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    const username = req.username
    const avatar = req.fileurl
    if (!avatar) {
        res.status(400).send("Avatar Missing")
    } else {
        Profiles.findOneAndUpdate({username}, {avatar}, {new: true}, (err, item) => {
            if (err) {
                res.status(404).send({error: err})
            } else {
                if (item) {
                    res.status(200).send({username, avatar: item.avatar})
                } else {
                    res.status(404).send({result: 'No match'})
                }
            }
        })
    }
}

module.exports = (app) => {
    app.put('/headline', putHeadline);
    app.get('/headline/:user?', getHeadline);
    app.put('/email', putEmail);
    app.get('/email/:user?', getEmail);
    app.get('/dob/:user?', getDob);
    app.put('/zipcode', putZipcode);
    app.get('/zipcode/:user?', getZipcode);
    app.put('/avatar', uploadImage('exampleFormControlFile1'), putAvatar);
    app.get('/avatar/:user?', getAvatar);
    app.get('/profile/:user?', getProfile);
}