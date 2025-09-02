process.loadEnvFile();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const timeout = require('./middlewares/timeout.js');
const logger = require('./middlewares/morgan.js');
const { version } = require('./package.json');
require('./passport.js');

// Routes
const IndexRouter = require('./routes/Index.js');
const SPCRouter = require('./routes/SPC.js');
const APIRouter = require('./routes/v1.js');

// Axios instance
const axios = require('axios');
axios.defaults.timeout = 14000;
axios.defaults.headers.common['User-Agent'] = `Mozilla/5.0 (compatible; StellaMirror${process.env.MIRROR_ID}/${version}; +https://stella.sefinek.net)`;

// Create express app
const app = express();

// Proxy
app.set('trust proxy', 1);

// Middlewares
app.use(cors());
app.use(helmet());
app.use(passport.initialize());
app.use(timeout());
app.use(express.static('public'));
app.use(logger);


// Routes
app.use(IndexRouter);
app.use('/api/v1', SPCRouter);
app.use('/api/v1', APIRouter);


// Run the server
const { PORT } = process.env;
app.listen(PORT, () => process.send ? process.send('ready') : console.log(`Server running at http://127.0.0.1:${PORT}`));