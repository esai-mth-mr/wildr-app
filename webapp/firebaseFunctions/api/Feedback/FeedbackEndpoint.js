const {GetAllFeedback, SaveFeedback} = require("./FeedbackQueries");
const  {VerifyAdminToken} = require("../Authentication/Authentication");


function FeedbackEndpoints() {
    this.saveFeedback = (request, response) => {
        SaveFeedback(request.body, request.headers.authorization)
            .then(r => response.send(r))
            .catch(error => response.status(500).send(error))
    }
    this.getFeedback = (request, response) =>{
        VerifyAdminToken(request.headers.authorization)
            .then(() =>
                GetAllFeedback()
                    .then(r => response.send(r))
                    .catch(error => response.status(500).send(error))
            )
            .catch(error => {
                response.status(401).send(error)
            })
    }
}

module.exports = {FeedbackEndpoints}