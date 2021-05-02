const fs = require('fs');

var json = JSON.parse(fs.readFileSync('./environment.json', 'utf-8'));

/**
 * Check if the user is an admin.
 * @param {string} user_id
 * @returns If the user is an admin.
 */
function isUserAdmin(user_id) {
    return json['admins'].includes(user_id);
}

module.exports = {
    isRegistrationAllowed: json['registration'],
    isUserAdmin: isUserAdmin,
    admins: json['admins'],
    debug: json['debug'],
    captcha_secret: ["google-captcha-key"]
};
