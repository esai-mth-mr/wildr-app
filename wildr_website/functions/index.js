const express = require("express");
const cors = require("cors");
const app = express();
const {functions, project} = require('./Imports')
app.use(cors());

const {ContactEndpoints} = require('./api/Contact/ContactUsEndpoints')
let contactEndpoints = new ContactEndpoints();
app.post('/api/contact/send', contactEndpoints.sendContactMail)
app.post('/api/contact', contactEndpoints.sendContactEmail)
const {SendEmailEndpoints} = require('./api/SendEmail/SendEmailEndpoints')
let sendEmailEndpoints = new SendEmailEndpoints();
app.post('/api/sendLegalEmail', sendEmailEndpoints.sendEmail)

const {FeedbackEndpoints} = require('./api/Feedback/FeedbackEndpoint')
let feedbackEndpoints  = new FeedbackEndpoints();
app.post('/api/feedback', feedbackEndpoints.saveFeedback)
app.get('/api/admin/feedback', feedbackEndpoints.getFeedback) //admin

app.get('/api/health', (request, response)=>{
    response.send(project)
})
exports.app = functions.https.onRequest(app);