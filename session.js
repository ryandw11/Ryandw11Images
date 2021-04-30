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
    let sessionKey = session.key;
    if(sessionKey == null) {
        session.loggedin = false;
        session.username = null;
        invalid_callback();
        return;
    }

    db.get(`SELECT user_id, user_name, current_session, session_creation FROM users WHERE current_session=$session`, 
    {
        $session: sessionKey
    }, 
    (err, row) => {
        if(row == null || row == undefined) {
            resetSession(session);
            invalid_callback();
            return;
        }
        if(row.current_session == null || row.session_creation == null){
            resetSession(session);
            invalid_callback();
            return;
        }
        if(sessionKey !== row.current_session){
            resetSession(session);
            invalid_callback();
            return;
        }

        // Two Weeks
        if(!validSessionTime(row.session_creation)){
            resetSession(session);
            db.run(`UPDATE users SET current_session = NULL, session_creation = NULL WHERE user_id = $user_id`, {
                $user_id: row.user_id
            }, () => invalid_callback());
            return;
        }

        session.username = row.user_name;
        session.loggedin = true;
        valid_callback();
    });
}

/**
 * Check if the session time is valid.
 * @param {Number} session_time The creation of the session in milliseconds.
 * @returns If the session time is valid.
 */
function validSessionTime(session_time){
    if(session_time == null || session_time == undefined)
        return false;

    let currentTime = Date.now();
    // Two Weeks
    if(currentTime - session_time > 1.21e+9){
        return false;
    }
    return true;
}

/**
 * Reset the session.
 * @param {*} session The session to reset. (From req.session).
 */
function resetSession(session){
    session.key = null;
    session.loggedin = false;
    session.username = null;
}

module.exports = {
    validateSession: validateSession,
    validSessionTime: validSessionTime
}