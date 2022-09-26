const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()

// MONGO_URI
const uri = process.env.MONGO_URI;

// Create mongo connection
const conn = mongoose.createConnection(uri, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = conn;