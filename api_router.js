/*

    This handles the Developer API for Ryandw11 Images.

    View the full documentation at https://docs.ryandw11.com/general/ryandw11-images/rest-api

    :)
*/

const express = require('express');
const router = express.Router();

// The maximum amount of images per page a user can request.
const MAX_INDEX_IMAGE_AMOUNT = 100;

module.exports = (db, environment) => {
    /**
     * Get the list of images in a paged system.
     */
    router.get('/images', (req, res) => {
        // Handle the page number to ensure that it is a valid number.
        let pageNumber = parseInt(req.query.pge);
        if (pageNumber == null || isNaN(pageNumber)) pageNumber = 1;
        if (pageNumber < 1) {
            res.send(`{"error": true, "error_message": "Invalid page count.", "images": []}`);
            return;
        }

        let title = req.query.title;
        if (title == null || title.length < 1) {
            title = '';
        }

        let imageCount = parseInt(req.query.imgCount);
        if (imageCount == null || isNaN(imageCount)) imageCount = 30;
        if (imageCount < 1) {
            res.send(`{"error": true, "error_message": "Invalid image count.", "images": []}`);
            return;
        }

        // Prevent the system from going above 100.
        imageCount = Math.min(imageCount, MAX_INDEX_IMAGE_AMOUNT);

        let sqlQuery =
            title.length < 1 || title == ''
                ? `SELECT * FROM images WHERE unlisted=0 ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`
                : `SELECT * FROM images WHERE (name LIKE $title) AND unlisted=0 ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`;
        let sqlQueryData =
            title.length < 1 || title == ''
                ? {
                      $pageNumber: (pageNumber - 1) * imageCount,
                      $maxDisplay: imageCount,
                  }
                : {
                      $pageNumber: (pageNumber - 1) * imageCount,
                      $maxDisplay: imageCount,
                      $title: `%${title}%`,
                  };

        // Get the latest images starting at the page number and using the max display.
        db.all(sqlQuery, sqlQueryData, (err, rows) => {
            // Get the total number of images.
            db.get('SELECT COUNT(*) FROM images WHERE (name LIKE $title) AND (unlisted=0)', {$title: `%${title}%`}, (err, count) => {
                let number = count['COUNT(*)'];
                // The array of page numbers.
                let pages = [];
                // If there is a next page.
                let hasNext = pageNumber * imageCount < number;
                // If there is a previous page.
                let hasPrev = (pageNumber - 2) * imageCount >= 0;

                // This logic controls what numbers go in the array.
                if (hasPrev && hasNext) {
                    pages = [pageNumber - 1, pageNumber, pageNumber + 1];
                } else if (hasNext) {
                    pages = [pageNumber, pageNumber + 1];
                    if ((pageNumber + 1) * imageCount < number) pages.push(pageNumber + 2);
                } else if (hasPrev) {
                    if ((pageNumber - 3) * imageCount >= 0) pages = [pageNumber - 2, pageNumber - 1, pageNumber];
                    else pages = [pageNumber - 1, pageNumber];
                }
                // If there is no next or previous page.
                else {
                    pages = [pageNumber];
                }

                // Add the /raw/ address in front of the image file.
                for (let row of rows) {
                    row.file = 'https://img.ryandw11.com/raw/' + row.file;
                    delete row.unlisted;
                    delete row.id;
                }

                let jsonReturn = {
                    error: false,
                    hasPreviousPage: hasPrev,
                    hasNextPage: hasNext,
                    pageNumber: pageNumber,
                    totalImageCount: number,
                    images: rows,
                };

                let jsonData = JSON.stringify(jsonReturn);

                res.type('json');
                res.send(jsonData);
            });
        });
    });

    /**
     * Get the list of images for a specific user.
     */
    router.get('/images/:user', (req, res) => {
        let user = req.params.user;
        if (user == null || user.length != 36) {
            res.send(`{"error": true, "error_message": "Invalid User UUID.", "images": []}`);
            return;
        }

        // Handle the page number to ensure that it is a valid number.
        let pageNumber = parseInt(req.query.pge);
        if (pageNumber == null || isNaN(pageNumber)) pageNumber = 1;
        if (pageNumber < 1) {
            res.send(`{"error": true, "error_message": "Invalid page count.", "images": []}`);
            return;
        }

        let title = req.query.title;
        if (title == null || title.length < 1) {
            title = '';
        }

        let imageCount = parseInt(req.query.imgCount);
        if (imageCount == null || isNaN(imageCount)) imageCount = 30;
        if (imageCount < 1) {
            res.send(`{"error": true, "error_message": "Invalid image count.", "images": []}`);
            return;
        }

        // Prevent the system from going above 100.
        imageCount = Math.min(imageCount, MAX_INDEX_IMAGE_AMOUNT);

        let sqlQuery =
            title.length < 1 || title == ''
                ? `SELECT * FROM images WHERE unlisted=0 AND author_id=$author_id ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`
                : `SELECT * FROM images WHERE (name LIKE $title) AND unlisted=0 AND author_id=$author_id ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`;
        let sqlQueryData =
            title.length < 1 || title == ''
                ? {
                      $pageNumber: (pageNumber - 1) * imageCount,
                      $maxDisplay: imageCount,
                      $author_id: user,
                  }
                : {
                      $pageNumber: (pageNumber - 1) * imageCount,
                      $maxDisplay: imageCount,
                      $title: `%${title}%`,
                      $author_id: user,
                  };

        // Get the latest images starting at the page number and using the max display.
        db.all(sqlQuery, sqlQueryData, (err, rows) => {
            // Get the total number of images.
            db.get(
                'SELECT COUNT(*) FROM images WHERE (name LIKE $title) AND (unlisted=0) AND author_id=$author_id',
                {$title: `%${title}%`, $author_id: user},
                (err, count) => {
                    let number = count['COUNT(*)'];
                    // The array of page numbers.
                    let pages = [];
                    // If there is a next page.
                    let hasNext = pageNumber * imageCount < number;
                    // If there is a previous page.
                    let hasPrev = (pageNumber - 2) * imageCount >= 0;

                    // This logic controls what numbers go in the array.
                    if (hasPrev && hasNext) {
                        pages = [pageNumber - 1, pageNumber, pageNumber + 1];
                    } else if (hasNext) {
                        pages = [pageNumber, pageNumber + 1];
                        if ((pageNumber + 1) * imageCount < number) pages.push(pageNumber + 2);
                    } else if (hasPrev) {
                        if ((pageNumber - 3) * imageCount >= 0) pages = [pageNumber - 2, pageNumber - 1, pageNumber];
                        else pages = [pageNumber - 1, pageNumber];
                    }
                    // If there is no next or previous page.
                    else {
                        pages = [pageNumber];
                    }

                    // Add the /raw/ address in front of the image file.
                    for (let row of rows) {
                        row.file = 'https://img.ryandw11.com/raw/' + row.file;
                        delete row.unlisted;
                        delete row.id;
                    }

                    let jsonReturn = {
                        error: false,
                        uuid: user,
                        hasPreviousPage: hasPrev,
                        hasNextPage: hasNext,
                        pageNumber: pageNumber,
                        totalImageCount: number,
                        images: rows,
                    };

                    let jsonData = JSON.stringify(jsonReturn);

                    res.type('json');
                    res.send(jsonData);
                }
            );
        });
    });

    /**
     * Get the list of all users (except admins)
     */
    router.get('/users', (req, res) => {
        let pageNumber = parseInt(req.query.pge);
        if (pageNumber == null || isNaN(pageNumber)) pageNumber = 1;
        if (pageNumber < 1) {
            res.send(`{"error": true, "error_message": "Invalid page number.", "users": []}`);
            return;
        }

        let username = req.query.username;
        if (username == null || username.length < 1) {
            username = '';
        }

        let imageCount = parseInt(req.query.userCount);
        if (imageCount == null || isNaN(imageCount)) imageCount = 30;
        if (imageCount < 1) {
            res.send(`{"error": true, "error_message": "Invalid user count.", "users": []}`);
            return;
        }

        // Prevent the system from going above 100.
        imageCount = Math.min(imageCount, MAX_INDEX_IMAGE_AMOUNT);

        let sqlQuery =
            username.length < 1 || username == ''
                ? `SELECT * FROM users  ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`
                : `SELECT * FROM users WHERE (user_name LIKE $username) ORDER BY id DESC LIMIT $pageNumber, $maxDisplay`;
        let sqlQueryData =
            username.length < 1 || username == ''
                ? {
                      $pageNumber: (pageNumber - 1) * imageCount,
                      $maxDisplay: imageCount,
                  }
                : {
                      $pageNumber: (pageNumber - 1) * imageCount,
                      $maxDisplay: imageCount,
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
                let hasNext = pageNumber * imageCount < number;
                // If there is a previous page.
                let hasPrev = (pageNumber - 2) * imageCount >= 0;

                // This logic controls what numbers go in the array.
                if (hasPrev && hasNext) {
                    pages = [pageNumber - 1, pageNumber, pageNumber + 1];
                } else if (hasNext) {
                    pages = [pageNumber, pageNumber + 1];
                    if ((pageNumber + 1) * imageCount < number) pages.push(pageNumber + 2);
                } else if (hasPrev) {
                    if ((pageNumber - 3) * imageCount >= 0) pages = [pageNumber - 2, pageNumber - 1, pageNumber];
                    else pages = [pageNumber - 1, pageNumber];
                }
                // If there is no next or previous page.
                else {
                    pages = [pageNumber];
                }

                // Remove critical user data.
                try{
                    for (let row of rows) {
                        delete row.id;
                        delete row.current_session;
                        delete row.session_creation;
                        delete row.password;
                    }
                } catch (e) {
                    res.send(`{"error": true, "error_message": "An internal error has occured.", "users": []}`);
                    return;
                }

                // Filter out the admins and any rows that still have important information somehow.
                rows.filter(row => !environment.isUserAdmin(row.user_id) && row.password == null && row.current_session == null);

                let jsonReturn = {
                    error: false,
                    hasPreviousPage: hasPrev,
                    hasNextPage: hasNext,
                    pageNumber: pageNumber,
                    totalUserCount: number,
                    users: rows,
                };

                let jsonData = JSON.stringify(jsonReturn);

                res.type('json');
                res.send(jsonData);
            });
        });
    });

    return router;
};
