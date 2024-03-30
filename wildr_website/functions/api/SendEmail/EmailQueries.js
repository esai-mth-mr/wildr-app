const formData = require('form-data');
const Mailgun = require('mailgun.js');

const {mailGunAuth, project} = require('../../Imports');
const mailgun = new Mailgun(formData);
const client = mailgun.client({username: 'api', key: mailGunAuth.apiKey});

function SendLegalEmail(sender, from, subject, message) {
    let html = "<table border='1'>"
    let buf = null;
    if(message.file) {
        let pos = message.file.indexOf('base64,');
        if (pos !== -1) {
            message.file = message.file.substr(pos + 7);
            buf = new Buffer.from(message.file, 'base64');
        }
        else message.file = null;
    }
    Object.entries(message).map(([key, value]) => {
        if(key!=="file" && key!=="filename"){
            html += "<tr><td>" + key.replace(/([A-Z])/g, (i) => ` ${i}`).replace(/^./, (i) => i.toUpperCase()).trim() + "</td> <td>" + value + "</td></tr>";
        }
    })
    html += "</table>";
    return new Promise((resolve, reject) => {
        client.messages.create(mailGunAuth.domain, {
            from: sender + " <"+from+">",
            to: 'legal@wildr.com',
            subject:subject, text:"",html: html,
            attachment: message.file?{data: buf, filename: message.filename}:null
        })
            .then(res => {
                resolve(res)
            })
            .catch(error => {
                reject(error)
            })
    })
}
function SendRealIdMail(email, handle) {
    return new Promise((resolve, reject) => {
        client.messages.create("wildr.com", {
            from: "Wildr <contact@wildr.com>",
            to: email,
            subject: "Congrats! You’re now Real ID Verified 🥳" + (project==="wildr-dev"?"DEV": ""),
            template: "real_id_verified",
            'h:X-Mailgun-Variables': JSON.stringify({handle: handle})
        })
            .then(res => resolve(res))
            .catch(error => reject(error))
    })
}

module.exports = {SendLegalEmail, SendRealIdMail}