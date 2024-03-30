const {SendLegalEmail, SendRealIdMail} = require('./EmailQueries')
const {VerifyCaptcha, VerifyAdminToken} = require("../Authentication/Authentication");

function SendEmailEndpoints() {
    this.sendEmail = (request, response) => {
        VerifyCaptcha(request.headers.recaptchatoken)
            .then(() => {
                SendLegalEmail(request.body.name, request.body.email, request.body.subject, request.body.message)
                    .then(r => response.send(r))
                    .catch(error => response.status(500).send(error))
            })
            .catch(error => response.status(401).send(error))

    }
    this.sendRealIdEmail = (request, response) => {
        VerifyAdminToken(request.headers.authorization)
            .then(() =>
                SendRealIdMail(request.body.email, request.body.handle)
                    .then(r => response.send(r))
                    .catch(error => response.status(500).send(error))
            )

    }
}

module.exports = {SendEmailEndpoints}