const express = require('express')
const app = express()

const dotenv = require('dotenv')
dotenv.config()

const bodyParser = require('body-parser')
// mongodb stuffs
const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override')

// Middleware
app.use(bodyParser.json())
app.use(methodOverride('_method'))

// set view engine
app.set('view engine', 'ejs');


// MONGO_URI
const uri = process.env.MONGO_URI;

// Create mongo connection
const conn = mongoose.createConnection(uri, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Init gfs
let gfs, gridfsBucket;

conn.once('open', () => {
    const collectionName = process.env.COLLECTION_NAME;
    // init stream

    // Add this line in the code
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: collectionName
    });
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection(collectionName)
})

// storage engine
const storage = new GridFsStorage({
    url: `${process.env.MONGO_URI}/${process.env.DB_NAME}`,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads', // should match collection name
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });


// @route GET /
app.get('/', (req, res) => {
    // res.render('index')
    gfs.files.find().toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
            res.render('index', { files: false });
        } else {
            files.map(file => {
                if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
                    file.isImage = true;
                } else {
                    file.isImage = false;
                }
            });
            res.render('index', { files: files });
        }
    });
})

// @route POST /upload
// @desc Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
    // res.json({ file: req.file })
    res.redirect('/')
})

// @route GET /files
// @desc Display all files in JSON
app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
            return res.status(404).json({
                err: 'No files exist'
            });
        }

        // Files exist
        return res.json(files);
    });
});

// @route GET /files/:filename
// @desc Display single file object
app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if file
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // File exists
        return res.json(file);
    });
});

// @route GET /image/:filename
// @desc Display Image
app.get('/image/:filename', async (req, res) => {
    await gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if file
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // Check if image
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {

            // Read output to browser
            // Till version 5+ we were using this 
            // const readStream = gfs.createReadStream(file.filename);
            // readStream.pipe(response);
            // For version 6+, Replace these two lines with the lines below
            const readStream = gridfsBucket.openDownloadStream(file._id);
            readStream.pipe(res);

        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
    const collectionName = process.env.COLLECTION_NAME;
    gfs.remove({ _id: req.params.id, root: collectionName }, (err) => {
        if (err) {
            // return res.status(404).json({ err: err });
            res.render('index', {
                message: 'Error deleting file',
                err: err
            });
        }

        res.redirect('/');
    });
});





const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`))
