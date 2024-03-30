const formData = require('form-data');
const Mailgun = require('mailgun.js');

const {mailGunAuth} = require('../../Imports');
const mailgun = new Mailgun(formData);
const client = mailgun.client({username: 'api', key: mailGunAuth.apiKey});

function SendContactMail(sender, from, subject, text) {
    return new Promise((resolve, reject) => {
        client.messages.create(mailGunAuth.domain, {
            from: sender + " <"+from+">",
            to: 'contact@wildr.com',
            subject:subject, text:text
        })
            .then(res => resolve(res))
            .catch(error => reject(error))
    })
}

module.exports = {SendContactMail}