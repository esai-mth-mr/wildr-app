const {admin, functions} = require('../../Imports');
function AddEmail(email, isMobile=false) {
    return new Promise((resolve, reject) => {
        if (/.+@.+\..+/.test(email)) {
            admin.database().ref(isMobile?'emailsFromApp':"emails").push(email)
                .then(r => {
                    functions.logger.log(email + " added to email list " + isMobile?"MOBILE":"", r)
                    resolve({isSuccessful: true, message: "Email added"})
                })
                .catch(error => {
                    functions.logger.error(email + " couldn't be added", error)
                    reject("Error adding email")
                })
        } else resolve({isSuccessful: false, message:"Not a valid email"})
    })
}
function GetAllEmails(isMobile=false){
    return new Promise((resolve, reject) => {
    admin.database().ref(isMobile?'emailsFromApp':"emails").get()
        .then(r=>{
            resolve(Array.from(new Set(Object.values(r.val()).map(r => r.toLowerCase()))))
        })
        .catch(error => {
            functions.logger.error("Could not check emails", error)
            reject("Error")
        })
    })
}

module.exports = {AddEmail, GetAllEmails}