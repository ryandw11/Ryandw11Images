/**
 * This file handles the Sessions for Ryandw11 Images.
 *
 * Even though I use express-session, I keep a session system on top of that for security.
 * Sessions are directly connected with an account and stored in the same row as their account data.
 * A user only has one of these sessions. Logging-on on a different computer before the session's
 * two week expiration date will result in both computers having the same session. (Note: They will
 * have a different express-session session.)
 *
 * This double system ensures security and allows me to validate if a user is logged in or not on multiple computers.
 * Most of this system is fairly redundant though.
 */

/**
 * Validate if a user's session is correct.
 * This checks to see if the session id exists in the database,
 * and if the session has not timed out.
 * If any of the conditions are not met, the session is reset.
 * This will also NULL out the session in the DB if it timed out.
 *
 * @param {*} db The database.
 * @param {*} session The session from req.session.
 * @param {Function} valid_callback  The valid callback.
 * @param {Function} invalid_callback  The invalid callback.
 * @returns void
 */
function validateSession(db, session, valid_callback, invalid_callback) {
    if(session == null || session == undefined){
        invalid_callback();
        return;
    }

    let sessionKey = session.key;
    if (sessionKey == null) {
        session.loggedin = false;
        session.username = null;
        session.destroy(() => {});
        invalid_callback();
        return;
    }

    db.get(
        `SELECT user_id, user_name, current_session, session_creation FROM users WHERE current_session=$session`,
        {
            $session: sessionKey,
        },
        (err, row) => {
            if (row == null || row == undefined) {
                resetSession(session);
                invalid_callback();
                return;
            }
            if (row.current_session == null || row.session_creation == null) {
                resetSession(session);
                invalid_callback();
                return;
            }
            if (sessionKey !== row.current_session) {
                resetSession(session);
                invalid_callback();
                return;
            }

            // Two Weeks
            if (!validSessionTime(row.session_creation)) {
                resetSession(session);
                db.run(
                    `UPDATE users SET current_session = NULL, session_creation = NULL WHERE user_id = $user_id`,
                    {
                        $user_id: row.user_id,
                    },
                    () => invalid_callback()
                );
                return;
            }

            session.username = row.user_name;
            session.loggedin = true;
            valid_callback();
        }
    );
}

/**
 * Check if the session time is valid.
 * @param {Number} session_time The creation of the session in milliseconds.
 * @returns If the session time is valid.
 */
function validSessionTime(session_time) {
    if (session_time == null || session_time == undefined) return false;

    let currentTime = Date.now();
    // Two Weeks
    if (currentTime - session_time > 1.21e9) {
        return false;
    }
    return true;
}

/**
 * Reset the session.
 * @param {*} session The session to reset. (From req.session).
 */
function resetSession(session) {
    session.key = null;
    session.loggedin = false;
    session.username = null;
    session.destroy(() => {});
}

module.exports = {
    validateSession: validateSession,
    validSessionTime: validSessionTime,
};
