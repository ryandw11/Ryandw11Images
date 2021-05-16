const express = require('express');
const router = express.Router();
const sessioner = require('./session.js');

const INDEX_IMAGE_AMOUNT = 20;

function getThemeNumber(req) {
    if(req.session == null || req.session == undefined)
        return 0;
    if (req.session.theme != null) {
        return req.session.theme;
    }
    return 0;
}

module.exports = (db, environment) => {
    // Allows admins to see users.
    router.get('/users', (req, res) => {
        sessioner.validateSession(
            db,
            req.session,
            () => {
                if (!req.session.isAdmin) {
                    res.redirect('/');
                    return;
                }
                // Handle the page number to ensure that it is a valid number.
                let pageNumber = parseInt(req.query.pge);
                if (pageNumber == null || isNaN(pageNumber)) pageNumber = 1;
                if (pageNumber < 1) {
                    res.redirect('/');
                    return;
                }

                let username = req.query.username;
                if (username == null || username.length < 1) {
                    username = '';
                }

                let sqlQuery =
                    username.length < 1 || username == ''
                        ? `SELECT * FROM users  ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`
                        : `SELECT * FROM users WHERE (user_name LIKE $username) ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`;
                let sqlQueryData =
                    username.length < 1 || username == ''
                        ? {
                              $pageNumber: (pageNumber - 1) * INDEX_IMAGE_AMOUNT,
                              $maxDisplay: INDEX_IMAGE_AMOUNT,
                          }
                        : {
                              $pageNumber: (pageNumber - 1) * INDEX_IMAGE_AMOUNT,
                              $maxDisplay: INDEX_IMAGE_AMOUNT,
                              $username: `%${username}%`,
                          };

                // Get the latest images starting at the page number and using the max display.
                db.all(sqlQuery, sqlQueryData, (err, rows) => {
                    // Get the total number of images.
                    db.get('SELECT COUNT(*) FROM users WHERE (user_name LIKE $username)', {$username: `%${username}%`}, (err, count) => {
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
                            row.isAdmin = environment.isUserAdmin(row.user_id);
                        }

                        // Render the page with all of the data.
                        res.render('admin_users', {
                            admin_users: 'active',
                            theme: getThemeNumber(req),
                            session: req.session,
                            users: rows,
                            userCount: number,
                            pageData: {
                                pageNumber: pageNumber,
                                hasNext: hasNext,
                                hasPrev: hasPrev,
                                pages: pages,
                                nextPage: pageNumber + 1,
                                previousPage: pageNumber - 1,
                            },
                            queryData: {
                                username: username,
                            },
                        });
                    });
                });
            },
            () => {
                res.redirect("/");
                return;
            }
        );
    });

    return router;
};
