const {admin, functions} = require("../../Imports");
const {VerifyToken} = require("../Authentication/Authentication");

function SaveFeedback(feedback, token){
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        let userData = null
        let data;
        if (token) {
            try{
            userData = await VerifyToken(token);
            data =  {
                ...feedback,
                email: userData?.email,
                uid: userData.uid,
                name: userData?.displayName,
                phoneNumber: userData?.phoneNumber,
                time: new Date()
            }}
            catch (e){
                data = {...feedback, time: new Date()}
            }
        }
        else data = {...feedback, time: new Date()};
        data = JSON.parse(JSON.stringify(data),
            (key, value) => value === null || value === '' ? undefined : value)
        functions.logger.log(data)
        admin.database().ref('feedback').push(data)
            .then(r => {
                functions.logger.log("Feedback saved", r)
                resolve("Thanks for your feedback")
            })
            .catch(error => {
                functions.logger.error("Feedback ", error)
                reject("Oops try again later")
            })
    })
}
function GetAllFeedback(){
    return new Promise((resolve, reject)=>{
        admin.database().ref('feedback').get()
            .then(r=>resolve(Object.values(r.val())))
            .catch(reject)
    })
}
module.exports = {SaveFeedback, GetAllFeedback}