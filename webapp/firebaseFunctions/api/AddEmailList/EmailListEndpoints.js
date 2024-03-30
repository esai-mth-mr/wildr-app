const {AddEmail, GetAllEmails} = require('./EmailListQuery')
const {VerifyCaptcha, VerifyAdminToken} = require("../Authentication/Authentication");

function EmailListEndpoints() {
    this.addEmail = (request, response) => {
        if (request.query.mobile === 'true') {
            AddEmail(request.body.email, true)
                .then(r => response.send(r))
                .catch(error => response.status(500).send(error))
        } else {
            VerifyCaptcha(request.headers.recaptchatoken)
                .then(() => {
                    AddEmail(request.body.email)
                        .then(r => response.send(r))
                        .catch(error => response.status(500).send(error))
                })
                .catch(error => response.status(500).send(error))
        }
    }
    this.getAllEmail = (request, response) => {
        VerifyAdminToken(request.headers.authorization)
            .then(() =>
                GetAllEmails()
                    .then(r => response.send(r))
                    .catch(error => response.status(500).send(error))
            )
            .catch(error => {
                response.status(401).send(error)
            })

    }
    this.getAllEmailMobile = (request, response) => {
        VerifyAdminToken(request.headers.authorization)
            .then(() =>
                GetAllEmails(true)
                    .then(r => response.send(r))
                    .catch(error => response.status(500).send(error))
            )
            .catch(error => {
                response.status(401).send(error)
            })

    }
}

module.exports = {EmailListEndpoints}