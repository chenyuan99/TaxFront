const multer = require('multer')
const stream = require('stream')
const cloudinary = require('cloudinary')

// process.env.CLOUDINARY_URL = "cloudinary://127163222839499:c3GIaPUl4ubjXBT7nxZXmKFGsDw@hsyhzghx6"
cloudinary.config({
    cloud_name: 'hsyhzghx6',
    api_key: '127163222839499',
    api_secret: 'c3GIaPUl4ubjXBT7nxZXmKFGsDw'
});

const doUpload = (publicName, req, res, next) => {
    // console.log("called")
    const uploadStream = cloudinary.uploader.upload_stream(result => {
        req.fileurl = result.url
        req.fileid = result.public_id
        next()
    }, {public_id: req.body[publicName]})
    const s = new stream.PassThrough()
    s.end(req.file.buffer)
    s.pipe(uploadStream)
    s.on('end', uploadStream.end)
}

const uploadImage = (publicName) => (req, res, next) => {
    // console.log("called upload")
    multer().single('text')(req, res, () => {
        if (!req.body.text) {
            req.text = null;
        } else if (!req.body.text[0] || req.body.text[0] == 'undefined') {
            req.text = 'please add text now'
        } else {
            req.text = req.body.text[0];
        }
    })


    multer().single('image')(req, res, () => {
        if (req.file === undefined) {
            // console.log("undefined")
            req.file = null;
            next()
        } else {
            // console.log("image called")
            doUpload(publicName, req, res, next)
        }
    })
}

module.exports = uploadImage