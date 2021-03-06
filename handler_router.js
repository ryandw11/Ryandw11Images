/*
    ===================[Handler Router]===================
    This handles the routing for any kind of user action for the website.
    Stuff like uploading and updating image data.
    ===================[Handler Router]===================
*/

const express = require('express');
const router = express.Router();
const {v4: uuid} = require('uuid');
const sessioner = require('./session.js');
const fs = require('fs');

const mmm = require('mmmagic'),
    Magic = mmm.Magic;
const magic = new Magic(mmm.MAGIC_MIME_TYPE);

const multer = require('multer');

/**
 * Generate a short ID for the images.
 * @returns  A short ID for the images.
 */
function uid() {
    return Date.now().toString(36).substr(1, 4) + Math.random().toString(36).substr(2, 5);
}

/**
 * Get the file extension from the MIME type.
 * 
 * @param {string} mimetype
 * @returns The file extension.
 */
function fileTypeFromMimeType(mimetype) {
    switch (mimetype) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/gif':
            return '.gif';
        case 'image/png':
            return '.png';
    }
}

/**
 * Check if the MIMEType is valid.
 * 
 * @param {string} mimetype The mime type.
 * @returns If the mime type is valid.
 */
function validMimeType(mimetype) {
    switch (mimetype) {
        case 'image/jpeg':
            return true;
        case 'image/gif':
            return true;
        case 'image/png':
            return true;
        default:
            return false;
    }
}

// Mutler storage settings. Store data on the disk.
var storage = multer.diskStorage({
    // Save it at data/uploads.
    destination: function (req, file, cb) {
        cb(null, 'data/uploads/');
    },
    // Name the file with the generated id + the mime type.
    filename: function (req, file, cb) {
        cb(null, uid() + fileTypeFromMimeType(file.mimetype));
    },
});

module.exports = (db, environment) => {
    /**
     * Filters out the images based upon if the mime type is valid
     * and the session is valid.
     *
     * @param {*} req The request.
     * @param {*} file The file.
     * @param {*} cb The function to tell multer what is valid.
     */
    function fileFilter(req, file, cb) {
        sessioner.validateSession(
            db,
            req.session,
            () => {
                cb(null, validMimeType(file.mimetype));
            },
            () => {
                cb(null, false);
            }
        );
    }

    var upload = multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            // 3 MB File Size Limit
            fileSize: 3e6,
        },
    });

    /**
     * Deletes all the images in a request.
     *
     * @param {*} files The files field in the request body.
     * @returns Nothing.
     */
    function deleteImages(files) {
        if (files == null) return;
        for (let file of files) {
            fs.unlink('./' + file.path, () => {});
        }
    }

    /**
     * This handles the response from the upload page.
     */
    router.post('/upload', upload.array('fileImage', 12), (req, res, next) => {
        // Validate the captcha.
        environment.runCaptchaFetch(
            0.6,
            req,
            () => {
                sessioner.validateSession(
                    db,
                    req.session,
                    () => {
                        let files = req.files;
                        let body = req.body;
                        // Validate all of the fields.
                        if (files == null || files == undefined) {
                            res.redirect('/upload?err=1');
                            return;
                        }
                        if (files.length < 1 || files.length > 13) {
                            res.redirect('/upload?err=2');
                            deleteImages(files);
                            return;
                        }
                        if (body.name == null || body.caption == null) {
                            res.redirect('/upload?err=4');
                            deleteImages(files);
                            return;
                        }
                        if (body.name.length < files.length || body.caption.length < files.length) {
                            res.redirect('/upload?err=4');
                            deleteImages(files);
                            return;
                        }

                        for (let i in files) {
                            // Define and validate file data.
                            let name = body.name[i];
                            if (name.length > 30) {
                                fs.unlink('./' + files[i].path, () => {});
                                continue;
                            }
                            let caption = body.caption[i];
                            if (caption.length > 1000) {
                                fs.unlink('./' + files[i].path, () => {});
                                continue;
                            }
                            // If unlistedImage is null, then no image is unlisted.
                            let unlisted = body.unlistedImage == null ? 0 : body.unlistedImage[i] == undefined ? 0 : 1;

                            let file_id = files[i].filename.split('.')[0];

                            // Detect the true file type to prevent just renaming the file.
                            magic.detectFile('./' + files[i].path, (err, result) => {
                                if (!validMimeType(result)) {
                                    fs.unlink('./' + files[i].path, () => {});
                                    return;
                                }
                                db.get(
                                    'SELECT (user_id) FROM users WHERE current_session = $session',
                                    {
                                        $session: req.session.key,
                                    },
                                    (err, row) => {
                                        if (row == null) return;
                                        db.run(
                                            `INSERT INTO images (file_id, uuid, name, caption, unlisted, author_id, file) VALUES ($file_id, $uuid, $name, $caption, $unlisted, $author_id, $file)`,
                                            {
                                                $file_id: file_id,
                                                $uuid: uuid(),
                                                $name: name,
                                                $caption: caption,
                                                $unlisted: unlisted,
                                                $author_id: row.user_id,
                                                $file: files[i].filename,
                                            }
                                        );
                                    }
                                );
                            });
                            // End of Magic Mime type detection.
                        }

                        req.files = null;
                        body.name = null;
                        body.caption = null;

                        res.redirect('/');
                        next();
                    },
                    () => {
                        res.redirect('/upload?err=3');
                    }
                );
            },
            () => {
                res.redirect('/upload?err=5');
            }
        );
    });

    /**
     * This handles the response for updating an image.
     */
    router.post('/update', (req, res) => {
        let uuid = req.body.img_uuid;
        let name = req.body.name;
        let caption = req.body.caption;

        if (uuid == null) {
            res.redirect('/');
            return;
        }

        if (name == null || name.length < 1 || name.length > 40) {
            res.redirect('/');
            return;
        }

        if (caption == null || caption.length > 100) caption = '';

        sessioner.validateSession(
            db,
            req.session,
            () => {
                db.get(
                    `SELECT * FROM images WHERE uuid=$uuid`,
                    {
                        $uuid: uuid,
                    },
                    (err, imageRow) => {
                        if (imageRow == null) {
                            res.redirect('/');
                            return;
                        }

                        db.get(
                            `SELECT user_name, user_id FROM users WHERE current_session = $current_session`,
                            {
                                $current_session: req.session.key,
                            },
                            (err, userRow) => {
                                if (userRow == null) {
                                    res.redirect('/image/' + imageRow.file_id);
                                    return;
                                }
                                let isAdmin = environment.isUserAdmin(userRow.user_id);
                                if (imageRow.author_id !== userRow.user_id && !isAdmin) {
                                    res.redirect('/image/' + imageRow.file_id);
                                    return;
                                }
                                db.run(`UPDATE images SET name = $name, caption = $caption WHERE uuid = $uuid`, {
                                    $name: name,
                                    $caption: caption,
                                    $uuid: uuid,
                                });
                                res.redirect('/image/' + imageRow.file_id);
                                return;
                            }
                        );
                    }
                );
            },
            () => {
                res.redirect('/');
            }
        );
    });

    // Handles the deletion of an image.
    router.post('/delete', (req, res) => {
        let uuid = req.body.img_uuid;

        if (uuid == null) {
            res.redirect('/');
            return;
        }

        sessioner.validateSession(
            db,
            req.session,
            () => {
                db.get(
                    `SELECT * FROM images WHERE uuid=$uuid`,
                    {
                        $uuid: uuid,
                    },
                    (err, imageRow) => {
                        if (imageRow == null) {
                            res.redirect('/');
                            return;
                        }

                        db.get(
                            `SELECT user_name, user_id FROM users WHERE current_session = $current_session`,
                            {
                                $current_session: req.session.key,
                            },
                            (err, userRow) => {
                                if (userRow == null) {
                                    res.redirect('/image/' + imageRow.file_id);
                                    return;
                                }
                                let isAdmin = environment.isUserAdmin(userRow.user_id);
                                if (imageRow.author_id !== userRow.user_id && !isAdmin) {
                                    res.redirect('/image/' + imageRow.file_id);
                                    return;
                                }

                                // Delete actual image.
                                fs.unlink('./data/uploads/' + imageRow.file, () => {});

                                db.run(`DELETE FROM images WHERE uuid=$uuid`, {
                                    $uuid: uuid,
                                });

                                res.redirect('/');
                                return;
                            }
                        );
                    }
                );
            },
            () => {
                res.redirect('/');
            }
        );
    });

    // Handles the unlisting of an image.
    router.post('/unlisted', (req, res) => {
        let uuid = req.body.img_uuid;
        let unlisted = parseInt(req.body.unlistedValue);

        if (uuid == null) {
            res.redirect('/');
            return;
        }

        if (unlisted !== 0 && unlisted !== 1) {
            res.redirect('/');
            return;
        }

        sessioner.validateSession(
            db,
            req.session,
            () => {
                db.get(
                    `SELECT * FROM images WHERE uuid=$uuid`,
                    {
                        $uuid: uuid,
                    },
                    (err, imageRow) => {
                        if (imageRow == null) {
                            res.redirect('/');
                            return;
                        }

                        db.get(
                            `SELECT user_name, user_id FROM users WHERE current_session = $current_session`,
                            {
                                $current_session: req.session.key,
                            },
                            (err, userRow) => {
                                if (userRow == null) {
                                    res.redirect('/image/' + imageRow.file_id);
                                    return;
                                }
                                let isAdmin = environment.isUserAdmin(userRow.user_id);
                                if (imageRow.author_id !== userRow.user_id && !isAdmin) {
                                    res.redirect('/image/' + imageRow.file_id);
                                    return;
                                }
                                db.run(`UPDATE images SET unlisted = $unlisted WHERE uuid = $uuid`, {
                                    $unlisted: unlisted,
                                    $uuid: uuid,
                                });
                                res.redirect('/image/' + imageRow.file_id);
                                return;
                            }
                        );
                    }
                );
            },
            () => {
                res.redirect('/');
            }
        );
    });

    return router;
};
