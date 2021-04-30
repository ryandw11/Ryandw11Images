const express = require('express');
const router = express.Router();
const {v4: uuid} = require('uuid');
const sessioner = require('./session.js');

const fs = require('fs');

const bcrypt = require('bcrypt');
const saltrounds = 10;

/**
 * Check if a username is valid.
 * @param {String} username  The username to check.
 * @returns An error string if an error occurs, null otherwise.
 */
function validateUsername(username) {
    if (username == null || username.length == 0) return '?err=1';
    if (username.length > 20) return '?err=2';
    if (/^([a-zA-Z0-9-_]){3,20}$/g.test(username) === false) return '?err=3';

    return null;
}

/**
 * Check if a password is valid.
 * @param {String} password The plain-text password
 * @param {String} confirm_password  The confirm plain-text password.
 * @returns An error string if an error occurs, null otherwise.
 */
function validatePassword(password, confirm_password) {
    if (password == null || password.length == 0) return '?err=4';
    if (confirm_password == null || confirm_password.length == 0) return '?err=4';
    if (password.length < 5) return '?err=5';
    if (/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm.test(password) === false) return '?err=6';
    if (password !== confirm_password) return '?err=7';
    return null;
}

/**
 * This handles the account signup and login post requests.
 * @param {*} db The database.
 * @param {*} environment The environment.
 * @returns The router.
 */
module.exports = (db, environment) => {
    router.post('/signup', (req, res) => {
        if (!environment.isRegistrationAllowed) {
            res.redirect('/');
            return;
        }

        let username = req.body.username;
        let password = req.body.password;
        let confirm_password = req.body.confirm_password;
        if (validateUsername(username) != null) {
            res.redirect(`/login${validateUsername(username)}`);
            return;
        }

        if (validatePassword(password, confirm_password) != null) {
            res.redirect(`/login${validatePassword(password, confirm_password)}`);
            return;
        }

        let user_id = uuid();
        let session = uuid();
        let session_creation = Date.now();

        // Check to see if the username already exists.
        db.get(
            `SELECT (user_name) FROM users WHERE user_name = $username`,
            {
                $username: username,
            },
            (err, row) => {
                if (row != null && row != undefined) {
                    res.redirect('/login?err=8');
                    return;
                } else {
                    bcrypt.hash(password, saltrounds, function (err, hash) {
                        db.run(
                            `INSERT INTO users (user_id, user_name, password, current_session, session_creation) VALUES ($user_id, $user_name, $password, $current_session, $session_creation)`,
                            {
                                $user_id: user_id,
                                $user_name: username,
                                $password: hash,
                                $current_session: session,
                                $session_creation: session_creation,
                            }
                        );

                        req.session.username = username;
                        req.session.loggedin = true;
                        req.session.key = session;
                        res.redirect('/');
                    });
                }
            }
        );
    });

    router.post('/login', (req, res) => {
        let username = req.body.username;
        let password = req.body.password;

        db.get(
            `SELECT * FROM users WHERE user_name = $username`,
            {
                $username: username,
            },
            (err, row) => {
                if (row == null || row == undefined) {
                    res.redirect('/login?err=9');
                    return;
                }
                bcrypt.compare(password, row.password, (err, result) => {
                    if (!result) {
                        res.redirect('/login?err=10');
                        return;
                    }
                    let session_time = row.session_creation;
                    if (sessioner.validSessionTime(session_time)) {
                        req.session.key = row.current_session;
                        req.session.username = row.user_name;
                        req.session.loggedin = true;
                        res.redirect('/');
                        return;
                    } else {
                        let sessionKey = uuid();
                        db.run(
                            `UPDATE users SET current_session = $current_session, session_creation = $session_creation WHERE user_id = $user_id`,
                            {
                                $user_id: row.user_id,
                                $current_session: sessionKey,
                                $session_creation: Date.now(),
                            },
                            () => {
                                req.session.key = sessionKey;
                                req.session.username = row.user_name;
                                req.session.loggedin = true;
                                res.redirect('/');
                                return;
                            }
                        );
                    }
                });
            }
        );
    });

    router.post('/logout', (req, res) => {
        sessioner.validateSession(
            db,
            req.session,
            () => {
                db.run(
                    'UPDATE users SET current_session = NULL, session_creation = NULL WHERE current_session = $current_session',
                    {
                        $current_session: req.session.key,
                    },
                    () => {
                        req.session.key = null;
                        req.session.loggedin = false;
                        req.session.username = null;
                        req.session.destroy(() => {});
                        res.redirect('/login?suc=1');
                        return;
                    }
                );
            },
            () => {
                res.redirect('/');
                return;
            }
        );
    });

    router.post('/change-password', (req, res) => {
        sessioner.validateSession(
            db,
            req.session,
            () => {
                let current_password = req.body.current_password;
                if (current_password == null) {
                    res.redirect('/profile?err=1');
                    return;
                }

                db.get(
                    `SELECT * FROM users WHERE current_session = $current_session`,
                    {
                        $current_session: req.session.key,
                    },
                    (err, row) => {
                        if (row == null) {
                            res.redirect('/profile');
                            return;
                        }
                        // Ensure that the password is correct.
                        bcrypt.compare(current_password, row.password, (err, result) => {
                            if (!result) {
                                res.redirect('/profile?err=10');
                                return;
                            }

                            let new_password = req.body.new_password;
                            let confirm_new_password = req.body.confirm_new_password;
                            if (validatePassword(new_password, confirm_new_password) != null) {
                                res.redirect(`/profile${validatePassword(new_password, confirm_new_password)}`);
                                return;
                            }

                            // Hash the new password using bcrypt.
                            bcrypt.hash(new_password, saltrounds, function (err, hash) {
                                db.run(
                                    'UPDATE users SET password = $password WHERE user_id = $user_id',
                                    {
                                        $password: hash,
                                        $user_id: row.user_id,
                                    },
                                    () => {
                                        // Redirect to confirm a success.
                                        res.redirect('/profile?suc=1');
                                    }
                                );
                            });
                        });
                    }
                );
            },
            () => {
                res.redirect('/');
                return;
            }
        );
    });

    router.post('/delete-account', (req, res) => {
        sessioner.validateSession(
            db,
            req.session,
            () => {
                let password = req.body.confirm_password;
                if (password == null) {
                    res.redirect('/profile?derr=1');
                    return;
                }
                db.get(
                    `SELECT * FROM users WHERE current_session = $current_session`,
                    {
                        $current_session: req.session.key,
                    },
                    (err, row) => {
                        bcrypt.compare(password, row.password, (err, result) => {
                            if (!result) {
                                res.redirect('/profile?derr=2');
                                return;
                            }

                            db.serialize(() => {
                                // Delete Images
                                db.all(
                                    'SELECT * FROM images WHERE author_id = $user_id',
                                    {
                                        $user_id: row.user_id,
                                    },
                                    (err, imageRows) => {
                                        if (imageRows == null) {
                                            return;
                                        }
                                        for (let row of imageRows) {
                                            fs.unlink('./data/uploads/' + row.file, () => {});
                                        }
                                    }
                                );
                                // Delete their images from the database.
                                db.run('DELETE FROM images WHERE author_id = $user_id', {
                                    $user_id: row.user_id,
                                });
                                // Delete the user itself.
                                db.run(
                                    'DELETE FROM users WHERE user_id = $user_id',
                                    {
                                        $user_id: row.user_id,
                                    },
                                    () => {
                                        // Deletion
                                        req.session.key = null;
                                        req.session.loggedin = false;
                                        req.session.username = null;
                                        res.redirect('/login?suc=2');
                                    }
                                );
                            });
                        });
                    }
                );
            },
            () => {
                res.redirect('/');
                return;
            }
        );
    });

    router.post('/admin/revoke-session', (req, res) => {
        let revoke_id = req.body.revoke_id;
        if (revoke_id == null) {
            res.redirect('/');
            return;
        }
        sessioner.validateSession(
            db,
            req.session,
            () => {
                db.get('SELECT user_id FROM users WHERE current_session = $current_session', {$current_session: req.session.key}, (err, row) => {
                    if (row == null) {
                        res.redirect('/');
                        return;
                    }

                    // If not admin, redirect to index.
                    if (!environment.isUserAdmin(row.user_id)) {
                        res.redirect('/');
                        return;
                    }

                    // Nullify the current session for the defined user.
                    db.run(
                        'UPDATE users SET current_session = NULL, session_creation = NULL WHERE user_id = $user_id',
                        {
                            $user_id: revoke_id,
                        },
                        () => {
                            // Redirect the admin back to the profile.
                            res.redirect(`/profile/${revoke_id}?suc=1`);
                            return;
                        }
                    );
                });
            },
            () => {
                res.redirect('/');
                return;
            }
        );
    });

    router.post('/admin/delete-account', (req, res) => {
        sessioner.validateSession(
            db,
            req.session,
            () => {
                db.get('SELECT user_id FROM users WHERE current_session = $current_session', {$current_session: req.session.key}, (err, adminRow) => {
                    // If the user is not an admin.
                    if (!environment.isUserAdmin(adminRow.user_id)) {
                        res.redirect('/');
                        return;
                    }

                    let delete_id = req.body.delete_id;
                    if (delete_id == null) {
                        res.redirect(`/`);
                        return;
                    }

                    // Ensure the confirmation code is correct.
                    let confirm_code = req.body.confirm_code;
                    let random_code = req.body.random_code;
                    if (confirm_code == null || random_code == null || confirm_code !== random_code) {
                        res.redirect(`/profile/${delete_id}?err=1`);
                        return;
                    }

                    db.get(
                        `SELECT * FROM users WHERE user_id = $user_id`,
                        {
                            $user_id: delete_id,
                        },
                        (err, row) => {
                            db.serialize(() => {
                                // Delete Images
                                db.all(
                                    'SELECT * FROM images WHERE author_id = $user_id',
                                    {
                                        $user_id: row.user_id,
                                    },
                                    (err, imageRows) => {
                                        if (imageRows == null) {
                                            return;
                                        }
                                        for (let row of imageRows) {
                                            fs.unlink('./data/uploads/' + row.file, () => {});
                                        }
                                    }
                                );
                                // Delete their images from the database.
                                db.run('DELETE FROM images WHERE author_id = $user_id', {
                                    $user_id: row.user_id,
                                });
                                // Delete the user itself.
                                db.run(
                                    'DELETE FROM users WHERE user_id = $user_id',
                                    {
                                        $user_id: row.user_id,
                                    },
                                    () => {
                                        // Deletion
                                        res.redirect(`/`);
                                    }
                                );
                            });
                        }
                    );
                });
            },
            () => {
                res.redirect('/');
                return;
            }
        );
    });

    return router;
};
