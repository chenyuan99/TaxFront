const md5 = require('md5');
const cookieParser = require('cookie-parser')
const session = require('express-session')
const bodyParser = require('body-parser')
const mongoose = require("mongoose");
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const cors = require('cors');
const User = require('./model.js').User
const Profiles = require('./model.js').Profiles
const Article = require('./model.js').Article
const Comment = require('./model.js').Comment
const connectionString = 'mongodb+srv://yc149:Lovelife098!@cluster0.hqe6q.mongodb.net/social?retryWrites=true&w=majority';
const mySecretMessage = "test yc149"
const salt = Math.random() * 1000;
const redis = require("redis");
let cookieKey = 'sid'
const fs = require("fs");
const {request} = require("express");
const client = redis.createClient("redis://:pecb97496a2e8074497b485fda26cbdd6aef129eb2e8451481b80e7f97698fb57@ec2-44-199-125-244.compute-1.amazonaws.com:8850", {
    tls: {
        rejectUnauthorized: false
    }
});
const base_url = "https://yc149-final-frontend.surge.sh";

// const base_url = "http://localhost:4200";
function isLoggedIn(req, res, next) {
    const sid = req.cookies[cookieKey]
    if (!sid) {
        res.status(401).send('User session not exist')
    } else {
        client.hget(sid, "username", function (err, username) {
            if (username) {
                req.username = username
                next()
            } else {
                res.status(401).send('User session not exist')
            }
        })
    }
}

function login(req, res) {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    let username = req.body.username
    let password = req.body.password
    if (!username || !password) {
        res.status(400).send("Missing input username or password")
        return
    }
    User.find({username: username}).exec(function (err, users) {
        if (users.length === 0) {
            res.status(401).send("username not registered")
            return
        }
        const userObj = users[0]
        if (userObj === null) {
            res.status(401).send("Username missing")
        }
        const salt = userObj.salt
        const hash = userObj.hash
        const newhash = md5(password + salt)
        if (newhash !== hash) {
            res.status(401).send("Password is wrong!")
        } else {
            const sessionKey = md5(mySecretMessage + new Date().getTime() + userObj.username)
            client.hmset(sessionKey, "username", username)
            res.cookie(cookieKey, sessionKey, {
                maxAge: 3600 * 1000,
                httpOnly: true,
                sameSite: 'none',
                secure: true
            })
            const msg = {username: username, result: 'success'}
            res.send(msg)
        }
    })
}

function register(req, res) {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let dob = new Date(req.body.dob).getTime();
    let zipcode = req.body.zipcode;
    if (!username || !password || !email || !dob || !zipcode) {
        res.status(400).send({result: "Missing inputs"});
        return;
    }
    User.find({username: username}, function (err, users) {
        if (users.length !== 0) {
            res.status(401).send("username already registered")
            return
        }
        let hash = md5(password + salt);
        let userobj = new User({username: username, salt: salt, hash: hash})
        const profileObj = new Profiles({
            username: username,
            email: email,
            dob: dob,
            zipcode: zipcode,
            headline: "dummy headline",
            following: [],
            avatar: ""
        })
        userobj.save();
        profileObj.save();
        res.status(200).send({
            result: 'success',
            username: username
        });
    })
}

function logout(req, res) {
    const sid = req.cookies[cookieKey]
    client.del(sid)
    res.clearCookie(cookieKey)
    res.status(200).send('OK')
}

const putPassword = (req, res) => {
    const newPassword = req.body.password
    const username = req.username
    if (newPassword === null) {
        res.status(400).send("Password  missing")
        return
    }
    User.find({username: username}, function (err, users) {
        const userObj = users[0]
        const salt = userObj.salt
        const newSalt = md5(salt + new Date().getTime())
        const newHash = md5(newPassword + newSalt)
        User.updateMany(
            {username: username},
            {$set: {salt: newSalt, hash: newHash}},
            {new: true},
            function (err, profile) {
                res.status(200).send("password successfully changed")
            })
    })

}

const index = (req, res) => {
    console.log(req.params.user)
    res.send({hello: 'world'})
}

const corsOptions = {
    origin: ['http://localhost:4200', 'https://yc149-final-frontend.surge.sh/'], credentials: true, cookie: {
        sameSite: 'none',
        secure: true
    },
};

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use(session({
    secret: 'doNotGuessTheSecret',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
            clientID: '',
            clientSecret: '',
            callbackURL: "/auth/google/callback"
        },
        function (accessToken, refreshToken, profile, done) {
            let user = {
                'email': profile.emails[0].value,
                'name': profile.name.givenName + ' ' + profile.name.familyName,
                'givenName': profile.name.givenName,
                'id': profile.id,
                'token': accessToken
            };
            console.log(profile)
            const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
            const username = profile.name.givenName + "@" + "Google"
            console.log(user)
            User.findOne({username: username}).exec(function (err, user) {
                if (!user || user.length === 0) {
                    const userObj = new User({username: username, third_party_id: profile.id})
                    new User(userObj).save(function (err, usr) {
                        if (err) {
                            return done(err)
                        }
                    })
                    const profileObj = new Profiles({
                        username: username,
                        headline: "I am login in via Google",
                        following: [],
                        email: profile.emails[0].value,
                        zipcode: "00000",
                        dob: new Date(19990, 1, 1).getTime(),
                        avatar: profile.photos[0].value
                    })
                    new Profiles(profileObj).save(function (err, usr) {
                        if (err) {
                            return console.log(err)
                        }
                    })
                }
                return done(null, user)
            })
        })
);

const link2gg = (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    if (!username || !password) {
        return res.status(400).send("username or password missing")
    }
    User.find({username: username}).exec(function (err, users) {
        if (!users || users.length === 0) {
            return res.sendStatus(400).send({result: 'User does not exist in database'})
        }
        const userObj = users[0]
        if (!userObj) {
            res.status(400).send("User does not exist in database")
        }

        function isAuthorized(req, userObj) {
            let salt = userObj.salt;
            let password = req.body.password;
            let hash = userObj.hash;
            let new_hash = md5(password + salt)
            return hash === new_hash
        }

        if (isAuthorized(req, userObj)) {
            Article.updateMany({author: req.username}, {$set: {'author': username}}, {
                new: true,
                multi: true
            }, function () {
            })
            Article.updateMany({'comments.author': req.username}, {$set: {'comments.$.author': username}}, {
                new: true,
                multi: true
            }, function () {
            })
            Comment.updateMany({author: req.username}, {$set: {'author': username}}, {
                new: true,
                multi: true
            }, function () {
            })
            Profiles.findOne({username: req.username}).exec(function (err, profile) {
                if (profile) {
                    Profiles.findOne({username: username}).exec(function (err, newProfile) {
                        if (newProfile) {
                            const newFollowings = newProfile.following.concat(profile.following)
                            Profiles.updateMany({username: username}, {$set: {'following': newFollowings}}, function () {
                            })
                        }
                    })
                    Profiles.updateMany({username: req.username}, {$set: {'following': []}}, function () {
                    })
                }
            })
            User.findOne({username: username}).exec(function (err, user) {
                if (user) {
                    const usr = req.username.split('@');
                    const authObj = {}
                    authObj[`Google`] = usr[0]
                    User.updateMany({username: username}, {$addToSet: {'auth': authObj}}, {new: true}, function () {
                    })
                }
            })
            res.status(200).send({username: username, result: 'success'})
        } else {
            res.status(401).send("password is not correct")
        }
    })
}

const unlinkGoogle = (req, res) => {
    const username = req.username
    User.findOne({username: username}).exec(function (err, user) {
        if (user.auth.length !== 0) {
            User.updateMany({username: username}, {$set: {auth: []}}, {new: true}, function () {
                res.status(200).send({result: 'unlink success'})
            })
        } else {
            res.status(400).send("No account linkied")
        }
    })
}

passport.serializeUser(function (user, done) {
    done(null, user.id)
})

passport.deserializeUser(function (id, done) {
    User.findOne({authId: id}).exec(function (err, user) {
        done(null, user)
    })
})


function getGoogleStatus(req, res) {
    const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    let username = req.username
    User.find({username: username}).exec(function (err, users) {
        if (users.length === 0) {
            res.status(401).send("username not registered")
            return
        }
        const userObj = users[0]
        console.log(userObj)
        if (userObj === null) {
            res.status(401).send("Username missing")
        }
        if (!userObj.auth[0]) {
            const msg = {username: username, google: 'No Google Account Linked'}
            console.log(msg)
            res.send(msg)
        } else {
            const msg = {username: username, google: userObj.auth[0].Google}
            res.send(msg)
        }
    })
}

// https://yc149-final-frontend.surge.sh
module.exports = (app) => {
    app.use(cookieParser());
    app.enable('trust proxy')
    app.use(cors({origin: ["http://localhost:4200", 'https://yc149-final-frontend.surge.sh/']}));
    app.get('/', index);
    app.post('/register', register);
    app.post('/login', login);
    app.use(passport.initialize());
    app.get('/auth/google', passport.authenticate('google', {
        scope: ['https://www.googleapis.com/auth/plus.login', 'email']
    })); // could have a passport auth second arg {scope: 'email'}
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            failureRedirect: 'https://yc149-final-backend.herokuapp.com/auth/google'
        }), function (req, res) {
            const connector = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
            let obj = req.user
            if (req.username) {
                User.findOne({username: req.username}).exec(function (err, user) {
                        if (user !== null) {
                            let sid = obj.third_party_id;
                            client.hmset(sid, "username", username)
                            console.log("sid:" + sid);
                            res.cookie(cookieKey, sid, {
                                maxAge: 3600 * 1000,
                                httpOnly: true,
                                sameSite: 'none',
                                secure: true
                            });
                            User.updateMany(
                                {username: username},
                                {$set: {third_party_id: obj.third_party_id}},
                                {new: true},
                                function (err, profile) {
                                    res.status(200).send("password successfully changed")
                                })
                            res.redirect(base_url + '/main')
                        } else {
                            res.status(401).send('User session not exist');
                        }
                    }
                )
            }
            User.findOne({username: obj.givenName + "@Google"}).exec(function (err, user) {
                    if (user !== null) {
                        let sid = md5(user.hash + user.salt);
                        client.hmset(sid, "username", obj.givenName + "@Google")
                        console.log("sid:" + sid);
                        res.cookie(cookieKey, sid, {
                            maxAge: 3600 * 1000,
                            httpOnly: true,
                            sameSite: 'none',
                            secure: true
                        });
                        res.redirect(base_url + '/main')
                    } else {
                        let sid = obj.third_party_id
                        console.log("token login " + sid)
                        client.hmset(sid, "username", obj.username)
                        res.cookie(cookieKey, sid, {
                            maxAge: 3600 * 1000,
                            httpOnly: true,
                            sameSite: 'none',
                            secure: true
                        });
                        res.redirect(base_url + '/main')
                    }
                }
            )
        });
    app.use(isLoggedIn);
    app.post('/merge', link2gg)
    app.get('/unlink/google', unlinkGoogle)
    app.get('/auth/google/status', getGoogleStatus);
    app.put('/logout', logout);
    app.put('/password', putPassword);
}

