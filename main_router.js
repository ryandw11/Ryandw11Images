const express = require('express');
const router = express.Router();
const sessioner = require('./session.js');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const {title} = require('process');
const session = require('./session.js');
const {v4: uuid} = require('uuid');

// The number of images each page on the index contains.
const INDEX_IMAGE_AMOUNT = 30;

function getThemeNumber(req) {
    if(req.session == null || req.session == undefined)
        return 0;
    if (req.session.theme != null) {
        return req.session.theme;
    }
    return 0;
}

module.exports = (db, environment) => {
    /**
        ==[Index Page]==
        Address: /
        ==
        Optional Get Paramter:
        pge: Defines the current page.
    */
    router.get('/', (req, res) => {
        // Handle the page number to ensure that it is a valid number.
        let pageNumber = parseInt(req.query.pge);
        if (pageNumber == null || isNaN(pageNumber)) pageNumber = 1;
        if (pageNumber < 1) {
            res.redirect('/');
            return;
        }

        // Get the latest images starting at the page number and using the max display.
        db.all(
            `SELECT * FROM images ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`,
            {
                $pageNumber: (pageNumber - 1) * INDEX_IMAGE_AMOUNT,
                $maxDisplay: INDEX_IMAGE_AMOUNT,
            },
            (err, rows) => {
                // Get the total number of images.
                db.get(`SELECT COUNT(*) FROM images`, (err, count) => {
                    let number = count['COUNT(*)'];
                    // If the current page number is too high, redirect back to index.
                    if (pageNumber > Math.ceil(number / INDEX_IMAGE_AMOUNT) && Math.ceil(number / INDEX_IMAGE_AMOUNT) != 0) {
                        res.redirect('/');
                        return;
                    }
                    // The array of page numbers.
                    let pages = [];
                    // If there is a next page.
                    let hasNext = pageNumber * INDEX_IMAGE_AMOUNT < number;
                    // If there is a previous page.
                    let hasPrev = (pageNumber - 2) * INDEX_IMAGE_AMOUNT >= 0;

                    // This logic controls what numbers go in the array.
                    if (hasPrev && hasNext) {
                        pages = [pageNumber - 1, pageNumber, pageNumber + 1];
                    } else if (hasNext) {
                        pages = [pageNumber, pageNumber + 1];
                        if ((pageNumber + 1) * INDEX_IMAGE_AMOUNT < number) pages.push(pageNumber + 2);
                    } else if (hasPrev) {
                        if ((pageNumber - 3) * INDEX_IMAGE_AMOUNT >= 0) pages = [pageNumber - 2, pageNumber - 1, pageNumber];
                        else pages = [pageNumber - 1, pageNumber];
                    }
                    // If there is no next or previous page.
                    else {
                        pages = [pageNumber];
                    }

                    // Add the /raw/ address in front of the image file.
                    for (let row of rows) {
                        row.file = '/raw/' + row.file;
                    }

                    // Render the page with all of the data.
                    res.render('index', {
                        index: 'active',
                        theme: getThemeNumber(req),
                        session: req.session,
                        images: rows,
                        pageData: {
                            pageNumber: pageNumber,
                            hasNext: hasNext,
                            hasPrev: hasPrev,
                            pages: pages,
                            nextPage: pageNumber + 1,
                            previousPage: pageNumber - 1,
                        },
                    });
                });
            }
        );
    });

    router.get('/search', (req, res) => {
        // Handle the page number to ensure that it is a valid number.
        let pageNumber = parseInt(req.query.pge);
        if (pageNumber == null || isNaN(pageNumber)) pageNumber = 1;
        if (pageNumber < 1) {
            res.redirect('/');
            return;
        }

        let title = req.query.title;
        if (title == null || title.length < 1) {
            title = '';
        }

        let sqlQuery =
            title.length < 1 || title == ''
                ? `SELECT * FROM images ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`
                : `SELECT * FROM images WHERE (name LIKE $title) ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`;
        let sqlQueryData =
            title.length < 1 || title == ''
                ? {
                      $pageNumber: (pageNumber - 1) * INDEX_IMAGE_AMOUNT,
                      $maxDisplay: INDEX_IMAGE_AMOUNT,
                  }
                : {
                      $pageNumber: (pageNumber - 1) * INDEX_IMAGE_AMOUNT,
                      $maxDisplay: INDEX_IMAGE_AMOUNT,
                      $title: `%${title}%`,
                  };

        // Get the latest images starting at the page number and using the max display.
        db.all(sqlQuery, sqlQueryData, (err, rows) => {
            // Get the total number of images.
            db.get('SELECT COUNT(*) FROM images WHERE (name LIKE $title)', {$title: `%${title}%`}, (err, count) => {
                let number = count['COUNT(*)'];
                // The array of page numbers.
                let pages = [];
                // If there is a next page.
                let hasNext = pageNumber * INDEX_IMAGE_AMOUNT < number;
                // If there is a previous page.
                let hasPrev = (pageNumber - 2) * INDEX_IMAGE_AMOUNT >= 0;

                // This logic controls what numbers go in the array.
                if (hasPrev && hasNext) {
                    pages = [pageNumber - 1, pageNumber, pageNumber + 1];
                } else if (hasNext) {
                    pages = [pageNumber, pageNumber + 1];
                    if ((pageNumber + 1) * INDEX_IMAGE_AMOUNT < number) pages.push(pageNumber + 2);
                } else if (hasPrev) {
                    if ((pageNumber - 3) * INDEX_IMAGE_AMOUNT >= 0) pages = [pageNumber - 2, pageNumber - 1, pageNumber];
                    else pages = [pageNumber - 1, pageNumber];
                }
                // If there is no next or previous page.
                else {
                    pages = [pageNumber];
                }

                // Add the /raw/ address in front of the image file.
                for (let row of rows) {
                    row.file = '/raw/' + row.file;
                }

                // Render the page with all of the data.
                res.render('search', {
                    search: 'active',
                    theme: getThemeNumber(req),
                    session: req.session,
                    images: rows,
                    imageCount: number,
                    pageData: {
                        pageNumber: pageNumber,
                        hasNext: hasNext,
                        hasPrev: hasPrev,
                        pages: pages,
                        nextPage: pageNumber + 1,
                        previousPage: pageNumber - 1,
                    },
                    queryData: {
                        title: title,
                    },
                });
            });
        });
    });

    /**
     * ==[Login Page]==
     * Handles the logging in of people. If the use is already logged in, send them to their profile.
     */
    router.get('/login', (req, res) => {
        sessioner.validateSession(
            db,
            req.session,
            () => {
                res.redirect('/profile');
            },
            () => {
                res.render('login', {login: 'active', theme: getThemeNumber(req), isRegistrationAllowed: environment.isRegistrationAllowed});
            }
        );
    });

    /**
     * ==[Profile Page]==
     * If the user is logged in, show their profile page.
     */
    router.get('/profile', (req, res) => {
        // Validate that they are logged in.
        sessioner.validateSession(
            db,
            req.session,
            () => {
                // Get the curren username and id from the current session.
                db.get(
                    'SELECT user_name, user_id FROM users WHERE current_session = $current_session',
                    {
                        $current_session: req.session.key,
                    },
                    (usrErr, usrRow) => {
                        // If not found, then redirect to index.
                        if (usrRow == null) {
                            res.redirect('/');
                            return;
                        }
                        // Get all of their images.
                        db.all(
                            `SELECT * FROM images WHERE author_id = $id`,
                            {
                                $id: usrRow.user_id,
                            },
                            (err, rows) => {
                                res.render('profile_loggedin', {login: 'active', theme: getThemeNumber(req), session: req.session, images: rows});
                                return;
                            }
                        );
                    }
                );
            },
            () => {
                // If not logged in, log them in.
                res.redirect('/login');
            }
        );
    });

    /**
     * ==[Upload Page]==
     * Show the upload page. This can be seen without an account.
     */
    router.get('/upload', (req, res) => {
        res.render('upload', {upload: 'active', theme: getThemeNumber(req), session: req.session});
    });

    /**
     * ==[Image Page]==
     * This shows the nice version of each image.
     * ==
     * Address: /image/:image
     * ==
     * Parameters:
     * :image -> The id of the image to show.
     */
    router.get('/image/:image', (req, res) => {
        // Get the image.
        let image = req.params.image;
        // Check if it is possible for the image to be valid.
        if (image == null || image.length < 4) {
            res.redirect('/');
            return;
        }
        // Attempt to get the image using the possible id.
        db.get(
            'SELECT * FROM images WHERE file_id = $file_id',
            {
                $file_id: image,
            },
            (err, row) => {
                // If row is null, image is not found.
                if (row == null) {
                    res.redirect('/');
                    return;
                }
                // Select the user.
                db.get(
                    'SELECT user_name, current_session, user_id FROM users WHERE user_id = $user_id',
                    {
                        $user_id: row.author_id,
                    },
                    (usrErr, usrRow) => {
                        // If the user row is null, then go back to index.
                        if (usrRow == null) {
                            res.redirect('/');
                            return;
                        }
                        // If the user is not logged in, then there is no point checking to see if they are an admin.
                        if (!req.session.loggedin) {
                            res.render('image', {index: 'active', theme: getThemeNumber(req), session: req.session, image: row, user: usrRow, isAdmin: false});
                            return;
                        }
                        // Check if the user is an admin.
                        db.get(
                            'SELECT user_name, current_session, user_id FROM users where current_session = $current_session',
                            {$current_session: req.session.key},
                            (adminErr, adminRow) => {
                                if (adminRow == null) {
                                    res.render('image', {index: 'active', theme: getThemeNumber(req), session: req.session, image: row, user: usrRow, isAdmin: false});
                                    return;
                                }
                                if (environment.isUserAdmin(adminRow.user_id) && req.session.key !== usrRow.current_session) {
                                    res.render('image', {index: 'active', theme: getThemeNumber(req), session: req.session, image: row, user: usrRow, isAdmin: true});
                                } else {
                                    res.render('image', {index: 'active', theme: getThemeNumber(req), session: req.session, image: row, user: usrRow, isAdmin: false});
                                }
                                return;
                            }
                        );
                        // Render the image page.

                        return;
                    }
                );
            }
        );
    });

    /**
     * ==[Raw Image View]==
     * View the raw images.
     */
    router.get('/raw/:image', (req, res) => {
        let rawImage = req.params.image;
        // Ensure that the image is valid:
        if (!/^([a-z]|[A-Z]|[0-9])+(.png|.gif|.jpg)$/.test(rawImage)) {
            res.redirect('/');
            return;
        }
        let image = '/data/uploads/' + sanitize(rawImage);
        if (image.includes('../')) {
            res.status(404);
            res.type('txt').send('Image not found.');
            return;
        }
        try {
            fs.access('.' + image, (error) => {
                if (error) {
                    res.status(404);
                    res.type('txt').send('Image not found.');
                    return;
                } else {
                    res.sendFile(__dirname + image);
                    return;
                }
            });
        } catch (e) {
            res.status(404);
            res.type('txt').send('Image not found.');
            return;
        }
    });

    /**
     * ==[Profile]==
     * The profile for a single person.
     */
    router.get('/profile/:id', (req, res) => {
        let id = req.params.id;
        sessioner.validateSession(
            db,
            req.session,
            () => {
                // Check if the loggedin user is the same person as the profile they want.
                db.get(
                    `SELECT current_session, user_name, user_id FROM users WHERE user_id = $user_id`,
                    {
                        $user_id: id,
                    },
                    (err, usrRow) => {
                        if (usrRow == null) {
                            // Strange error that should never occur as the is should be valid.
                            res.redirect('/');
                            return;
                        }
                        // If they are the same person, redirect to the profile.
                        if (usrRow.current_session === req.session.key) {
                            res.redirect('/profile');
                            return;
                        }
                        // null out the obtained user session to prevent unwanted leak.
                        usrRow.current_session = null;

                        // Check if the current user is an admin.
                        db.get('SELECT user_id FROM users WHERE current_session = $current_session', 
                        { $current_session: req.session.key}, (err, adminRow) => {
                            // If the user is an admin.
                            let admin = environment.isUserAdmin(adminRow.user_id);
                            db.all(
                                `SELECT * FROM images WHERE author_id = $id`,
                                {
                                    $id: usrRow.user_id,
                                },
                                (err, rows) => {
                                    res.render('profile', {search: 'active', theme: getThemeNumber(req), session: req.session, images: rows, user: usrRow, admin: admin, random_code: uuid()});
                                    return;
                                }
                            );
                        });
                    }
                );
            },
            () => {
                // If the the person is not logged in.
                db.get(
                    `SELECT user_name, user_id FROM users WHERE user_id = $user_id`,
                    {
                        $user_id: id,
                    },
                    (err, usrRow) => {
                        if (usrRow == null) {
                            res.redirect('/');
                            return;
                        }

                        db.all(
                            `SELECT * FROM images WHERE author_id = $id`,
                            {
                                $id: usrRow.user_id,
                            },
                            (err, rows) => {
                                res.render('profile', {search: 'active', theme: getThemeNumber(req), session: req.session, images: rows, user: usrRow, admin: false});
                                return;
                            }
                        );
                    }
                );
            }
        );
    });

    return router;
};
