const request = require("request");
const {recaptchaKey, admin, functions, recaptchaV2Key} = require('../../Imports');

function VerifyCaptcha(reCaptchaToken) {
    return new Promise(((resolve, reject) => {
        const verifyCaptchaOptions = {
            uri: "https://www.google.com/recaptcha/api/siteverify",
            json: true,
            form: {
                secret: recaptchaKey,
                response: reCaptchaToken
            }
        };
        request.post(verifyCaptchaOptions, (err, response, body) => {
                if (err) reject("oops, something went wrong on our side");
                else if (!body.success) reject(body["error-codes"].join("."))
                else resolve({message: "Congratulations! We think you are human."});
            }
        );
    }))
}
function VerifyCaptchaV2(reCaptchaToken) {
    return new Promise(((resolve, reject) => {
        const verifyCaptchaOptions = {
            uri: "https://www.google.com/recaptcha/api/siteverify",
            json: true,
            form: {
                secret: recaptchaV2Key,
                response: reCaptchaToken
            }
        };
        request.post(verifyCaptchaOptions, (err, response, body) => {
                if (err) reject("oops, something went wrong on our side");
                else if (!body.success) reject(body["error-codes"].join("."))
                else resolve({message: "Congratulations! We think you are human."});
            }
        );
    }))
}
function VerifyToken(token) {
    return new Promise((resolve, reject) => {
        admin.auth().verifyIdToken(token.toString())
            .then(resolve)
            .catch(catchError => {
                functions.logger.warn("Token Error: ", catchError);
                reject( "Token expired")
            });
    });
}


function VerifyAdminToken(token) {
    return new Promise((resolve, reject) => {
        admin.auth().verifyIdToken(token.toString())
            .then(decodedToken => {
                decodedToken.admin && decodedToken.email.split('@')[1] === 'wildr.com'
                    ? resolve(decodedToken.uid)
                    : reject("Your not an admin")
            })
            .catch(catchError => {
                functions.logger.warn("Token Error: ", catchError);
                reject( "Token expired")
            });
    });
}

module.exports = {VerifyCaptcha, VerifyToken, VerifyAdminToken, VerifyCaptchaV2}