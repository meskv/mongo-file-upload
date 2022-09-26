const conn = require('./database/db');

const express = require('express')
const app = express()

const dotenv = require('dotenv')
dotenv.config()

const bodyParser = require('body-parser')
const methodOverride = require('method-override')

// Middleware
app.use(bodyParser.json())
app.use(methodOverride('_method'))

// set view engine
app.set('view engine', 'ejs');

// routes
app.use('/', require('./routes/file'))

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`))

