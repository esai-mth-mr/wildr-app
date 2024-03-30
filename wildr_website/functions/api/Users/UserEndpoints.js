const {GetAllUsers} = require("./UserQueries");
const {VerifyAdminToken} = require("../Authentication/Authentication");


function UserEndpoints() {
    this.getAllUsers = (request, response) => {
        VerifyAdminToken(request.headers.authorization)
            .then(() => {
                GetAllUsers()
                    .then(r => response.send(r))
                    .catch(error => response.status(500).send(error))
            })
            .catch(error => response.status(401).send(error))

    }
}

module.exports = {UserEndpoints}
