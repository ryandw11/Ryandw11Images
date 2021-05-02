const fs = require('fs');
const fetch = require('node-fetch');

var json = JSON.parse(fs.readFileSync('./environment.json', 'utf-8'));

/**
 * Check if the user is an admin.
 * @param {string} user_id
 * @returns If the user is an admin.
 */
function isUserAdmin(user_id) {
    return json['admins'].includes(user_id);
}

/**
 * Run the captcha fetch if debug mode is enabled.
 * @param {Number} wantedScore The wanted score.
 * @param {*} req The request from express.
 * @param {Function} successCallback If the return was succesful.
 * @param {Function} invalidCallback If the return was a failure.
 * @returns Void.
 */
function runCaptchaFetch(wantedScore, req, successCallback, invalidCallback) {
    if (json['debug']) {
        successCallback();
        return;
    }
    if(req.body['g-recaptcha-response'] == null || req.body['g-recaptcha-response'] == undefined || req.body['g-recaptcha-response'] == ''){
        invalidCallback();
        return;
    }

    fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${json['google-captcha-key']}&response=${req.body['g-recaptcha-response']}`,
    }).then(res => res.json()).then(data => {
        if(data.hostname !== 'img.ryandw11.com'){
            invalidCallback();
            return;
        }
        if(!data.success){
            invalidCallback();
            return;
        }
        if(data.score < wantedScore){
            invalidCallback();
            return;
        }
        successCallback();
    });
}

module.exports = {
    isRegistrationAllowed: json['registration'],
    isUserAdmin: isUserAdmin,
    admins: json['admins'],
    debug: json['debug'],
    captcha_secret: json['google-captcha-key'],
    runCaptchaFetch: runCaptchaFetch
};
