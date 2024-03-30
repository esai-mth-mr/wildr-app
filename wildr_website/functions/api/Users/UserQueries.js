const {admin} = require("../../Imports");

function GetAllUsers(){
    return new Promise(((resolve, reject) => {
        admin.auth().listUsers()
            .then(resolve)
            .catch(reject)
    }))
}

module.exports = {GetAllUsers}