const debug = false;

const express = require('express');
const session = require('express-session');
const app = express();
const fs = require('fs');
const md5 = require('md5');
const { v4: uuid } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const compression = require('compression');
const helmet = require('helmet');

const redis = require('redis');

if (!debug) {
    // Activate SSL for Ryandw11.com
    const https = require('https');
    const privateKey = fs.readFileSync('../privkey.pem', 'utf8');
    const certificate = fs.readFileSync('../fullchain.pem', 'utf8');

    var credentials = { key: privateKey, cert: certificate };
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(8443, () => console.log('Server running on port 8443...'));
} else {
    app.listen(8080, () => console.log("Sever running debug on port 8080..."));
}

// Setup the handlebars template engine.
const hbs = require('express-handlebars')({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        static(path) {
            return path;
        },
        escapeJSString(str) {
            if (!str) {
                return null;
            }
            return jsesc(str, {
                escapeEverything: true,
                wrap: true
            });
        },
        // Custom functionality that allows a basic if statement.
        ifEq(a, b, opts) {
            if(a == null || b == null)
                return opts.inverse(this);
            if (a == b)
                return opts.fn(this);
            else
                return opts.inverse(this);
        }
    }
});

app.use(helmet());

app.engine('hbs', hbs);
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));

if (!debug) {
    app.enable('view cache');
    app.use(compression());
}

// let RedisStore = require('connect-redis')(session);
// let redisClient = redis.createClient();

app.use(session({
    secret: 'a^fewfjwiofh-6Jfjsc&3+mca**fj4$$mcsjiog#4$',
    resave: false,
    saveUninitialized: true,
    // Two Weeks
    cookie: {
        maxAge: 1.21e+9
    }
    // store: new RedisStore({ client: redisClient }),
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*
 * Setup SQL 
 */

const db = new sqlite3.Database('./data/images.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY,
        file_id VARCHAR(40) NOT NULL,
        uuid VARCHAR(40) NOT NULL,
        name VARCHAR(40) NOT NULL,
        caption VARCHAR(100) NOT NULL,
        author_id VARCHAR(40) NOT NULL,
        file VARCHAR(40) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        user_id VARCHAR(40) NOT NULL,
        user_name VARCHAR(40) NOT NULL,
        password VARCHAR(100) NOT NULL,
        current_session VARCHAR(40),
        session_creation BIGINT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});


/*
 *  Setup Routes 
 * 
 */

const environment = require('./environment.js');
if(environment.isRegistrationAllowed)
    console.log("Running Ryandw11 Images with Registration Allowed!");
console.log(`There are ${environment.admins.length} admins.`);

const main_router = require('./main_router.js');
const account_router = require('./account_router.js');
const handler_router = require('./handler_router.js');
app.use('/', main_router(db, environment));
app.use('/auth', account_router(db, environment));
app.use('/handle', handler_router(db, environment));

app.post('/theme', (req, res) => {
    let data = req.body.theme;
    switch (data) {
        case "0":
            req.session.theme = 0;
            break;
        case "1":
            req.session.theme = 1;
            break;
        default:
            req.session.theme = 0;
            break;
    }

    // Go back to the previous page.
    res.redirect('back');
});