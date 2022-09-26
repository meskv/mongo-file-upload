const conn = require('../database/db');

const dotenv = require('dotenv')
dotenv.config()

// mongodb stuffs
const mongoose = require('mongoose')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')

const express = require('express')
router = express.Router()

// Init gfs
let gfs, gridfsBucket;

const collectionName = process.env.COLLECTION_NAME;
conn.once('open', () => {
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
                    // bucketName: 'uploads', // should match collection name
                    bucketName: collectionName, // should match collection name
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });


// @route GET /
router.get('/', (req, res) => {
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
router.post('/upload', upload.single('file'), (req, res) => {
    // res.json({ file: req.file })
    res.redirect('/')
})

// @route GET /files
// @desc Display all files in JSON
router.get('/files', (req, res) => {
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
router.get('/files/:filename', (req, res) => {
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

// // @route GET /image/:filename
// // @desc Display Image
// router.get('/image/:filename', async (req, res) => {
//     await gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//         // Check if file
//         if (!file || file.length === 0) {
//             return res.status(404).json({
//                 err: 'No file exists'
//             });
//         }
//         // Check if image
//         if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {

//             // Read output to browser
//             // Till version 5+ we were using this 
//             // const readStream = gfs.createReadStream(file.filename);
//             // readStream.pipe(response);
//             // For version 6+, Replace these two lines with the lines below
//             const readStream = gridfsBucket.openDownloadStream(file._id);
//             readStream.pipe(res);

//         } else {
//             res.status(404).json({
//                 err: 'Not an image'
//             });
//         }
//     });
// });

// // @route GET /pdf/:filename
// // @desc Display PDF
// router.get('/pdf/:filename', async (req, res) => {
//     await gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//         // Check if file
//         if (!file || file.length === 0) {
//             return res.status(404).json({
//                 err: 'No file exists'
//             });
//         }
//         // Check if PDF
//         if (file.contentType === 'application/pdf') {
//             const readStream = gridfsBucket.openDownloadStream(file._id);
//             readStream.pipe(res);

//         } else {
//             res.status(404).json({
//                 err: 'Not a PDF'
//             });
//         }

//     });
// });

// @route DELETE /files/:id
// @desc  Delete file
// router.delete('/files/:id', async (req, res) => {
//     console.log(req.params.id)
//     await gridfsBucket.delete({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
//         if (err) return res.status(404).json({ err: err })

//         console.log(`File with id ${req.params.id} deleted successfully`);
//         res.redirect('/');
//     });
// });

// @route DELETE /files/:filename
// @desc  Delete file
router.delete('/files/:filename', async (req, res) => {
    console.log(req.params.filename);
    const file = await gfs.files.findOne({ filename: req.params.filename });
    const gsfb = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
    gsfb.delete(file._id, function (err, gridStore) {
        if (err) return next(err);
        console.log(`File with filename ${req.params.filename} deleted successfully`);
        res.redirect('/');
    });
});

// @route GET /display/:filename
// @desc Display all files

// @route GET /pdf/:filename
// @desc Display PDF
router.get('/display/:filename', async (req, res) => {
    await gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if file
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // Check if PDF
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'application/pdf') {
            const readStream = gridfsBucket.openDownloadStream(file._id);
            readStream.pipe(res);

        } else {
            res.status(404).json({
                err: 'Not a Image or PDF'
            });
        }

    });
});





module.exports = router;