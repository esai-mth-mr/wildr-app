const {SendContactMail} = require('./ContactQueries')
const {VerifyCaptcha, VerifyCaptchaV2} = require("../Authentication/Authentication");

function ContactEndpoints() {
    this.sendContactMail = (request, response) => {
        VerifyCaptcha(request.headers.recaptchatoken)
            .then(() => {
                SendContactMail(request.body.name, request.body.email, request.body.subject, request.body.message)
                    .then(r => response.send(r))
                    .catch(error => response.status(401).send(error))
            })
            .catch(error => response.status(401).send(error))

    }
    this.sendContactEmail = (request, response) => {
        VerifyCaptchaV2(request.body['g-recaptcha-response'])
            .then(() => {
                SendContactMail(request.body.name, request.body.email, request.body.subject, request.body.message)
                    .then(r => response.send(r))
                    .catch(error => response.status(401).send(error))
            })
            .catch(error => response.status(401).send(error))

    }

}

module.exports = {ContactEndpoints}