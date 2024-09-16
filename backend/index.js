const express = require('express');
const bodyParser = require('body-parser');

let middleware = (req, res, next) => {
    // res.header('Access-Control-Allow-Origin',req.headers.origin)
    res.header('Access-Control-Allow-Origin',req.headers.origin || "http://localhost:4200"||"https://yc149-final-frontend.surge.sh/")
    res.header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-With, X-Session-Id");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE')
    res.header('Access-Control-Allow-Credentials',true)
    if(req.method === 'OPTIONS') {
        res.status(200).send("OK")
    } else {
        next()
    }
}



const app = express()
app.use(middleware)
app.use(bodyParser.json());

require('./src/auth')(app)
require('./src/articles')(app)
require('./src/profile')(app)
require('./src/following')(app)

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    const addr = server.address();
    console.log(`Server listening at http://${addr.address}:${addr.port}`)
});