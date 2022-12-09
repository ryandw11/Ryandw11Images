const version_id = "1.0.1";

const express = require('express');
const session = require('express-session');
const app = express();
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const compression = require('compression');
const helmet = require('helmet');

const { MulterError } = require('multer');

const environment = require('./environment.js');

if (!environment.debug) {
    // Activate SSL for img.ryandw11.com
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
const hbs = require('express-handlebars').engine({
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
        },
        // Highlights a specific set of characters in a string.
        surrWord(input, search) {
            input = input.replace("<", "&lt;").replace(">", "&gt;");
            let index = input.toLowerCase().indexOf(search.toLowerCase());

            if (index < 0) {
                return input.slice(0, 200);
            }

            let sectionOne = Math.max(0, index - 50);
            let sectionTwo = Math.min(input.length, index + 50);
            return (sectionOne != 0 ? "..." : "") + input.slice(sectionOne, index) + `<strong>${input.slice(index, index + search.length)}</strong>` + input.slice(index + search.length, sectionTwo) + (sectionTwo != input.length ? "..." : "");
        }
    }
});

app.use(helmet());

app.engine('hbs', hbs);
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));

if (!environment.debug) {
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
        maxAge: 1.21e+9,
        // Enable secure mode if not in debug.
        secure: !environment.debug
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
        unlisted INTEGER NOT NULL,
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
    db.run(`CREATE TABLE IF NOT EXISTS 'Ryandw11Images' (
        id INTEGER PRIMARY KEY,
        version_id VARCHAR(40) NOT NULL
    )`, () => {
        // Check to see if the table exists.
        db.all(`SELECT * FROM 'Ryandw11Images'`, (err, rows) => {
            if(rows.length < 1){
                // Insert the current version number into the table.
                db.run(`INSERT INTO 'Ryandw11Images' (version_id) VALUES ('${version_id}')`);
            }
        })
    });
    // Check to see if private exists. If it does not, add it.
    // TODO:: Remove this after a few versions.
    db.get(`SELECT unlisted FROM images`, (err, sel) => {
        if(sel !== undefined) return;
        console.log("Detected older version. Updating Database!");
        db.run(`ALTER TABLE images ADD unlisted INTEGER NOT NULL DEFAULT 0`, (err) => {
            if(err != null){
                console.log("Fatal error occured! Could not update database!");
                console.log(err);
                return;
            }
            console.log("Updated database to the recent version!");
        });
    })
});



/*
 *  Setup Routes 
 * 
 */
if(environment.isRegistrationAllowed)
    console.log("Running Ryandw11 Images with Registration Allowed!");
console.log(`There are ${environment.admins.length} admins.`);

const main_router = require('./main_router.js');
const account_router = require('./account_router.js');
const handler_router = require('./handler_router.js');
const api_router = require('./api_router.js');
const admin_router = require('./admin_router.js');
app.use('/', main_router(db, environment));
app.use('/auth', account_router(db, environment));
app.use('/handle', handler_router(db, environment));
app.use('/api/v1', api_router(db, environment));
app.use('/admin', admin_router(db, environment));

// This handles errors within the program.
app.use((err, req, res, next) => {
    // If it is a Multer error, redirect to the upload page with an error.
    if(err instanceof MulterError) {
        res.redirect("/upload?err=6");
        return;
    }

    function getThemeNumber(req) {
        if(req.session == null || req.session == undefined)
            return 0;
        if (req.session.theme != null) {
            return req.session.theme;
        }
        return 0;
    }

    console.log("A critical error has occured:");
    console.error(err.stack);

    // Render the error page.
    res.status(500).render("error", {debug: environment.debug, error: err.stack, session: req.session, theme: getThemeNumber(req)});
});

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