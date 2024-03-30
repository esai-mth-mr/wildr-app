const {CheckInvite, SendMultipleInviteCodeMails, GetAllCodesSent} = require("./InviteCodeQueries");
const {inviteCodeKey} = require("../../Imports");
const {VerifyAdminToken} = require("../Authentication/Authentication");

function InviteCodeEndpoints() {
    this.checkInvite = (request, response) => {
        CheckInvite(request.body.code)
            .then(r => response.send(r))
            .catch(error => response.status(500).send(error))
    }
    this.sendInternalInvite = (request, response) => {
        if (request.query.code !== inviteCodeKey) {
            response.status(401).send("Unauthorized")
            return;
        }
        if (!request.query.name) {
            response.status(401).send("Please provide a name")
            return;
        }
        let email = ['yash', 'daksh', 'melissa', 'vidit', 'tirtha']
            .includes(request.query.name?.toLowerCase())
            ? request.query.name?.toLowerCase() + '@wildr.com'
            : null;
        if (email) {
            SendMultipleInviteCodeMails([email])
                .then(() => response.send("Email sent to " + email))
                .catch(error => response.status(500).send(error))
        } else {
            response.status(401).send("Unauthorized")
        }

    }
    this.sendInviteMails = (request, response) => {
        VerifyAdminToken(request.headers.authorization)
            .then(() =>
                SendMultipleInviteCodeMails(request.body.emails)
                    .then(r => response.send(r))
                    .catch(error => response.status(500).send(error))
            )
            .catch(error => {
                response.status(401).send(error)
            })
    }
    this.getAllCodesSent = (request, response) => {
        VerifyAdminToken(request.headers.authorization)
            .then(() =>
                GetAllCodesSent()
                    .then(r => response.send(r))
                    .catch(error => response.status(500).send(error))
            )
            .catch(error=> {
                response.status(401).send(error)
            })
    }
}

module.exports = {InviteCodeEndpoints}