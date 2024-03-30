const {admin, functions, project} = require("../../Imports");
const formData = require('form-data');
const Mailgun = require('mailgun.js');

const {mailGunAuth} = require('../../Imports');
const mailgun = new Mailgun(formData);
const client = mailgun.client({username: 'api', key: mailGunAuth.apiKey});

async function CheckInvite(code) {
    try {
        if(parseInt(code)===476206) {
            functions.logger.log("Google used invite code", code)
            return {isSuccessful: true, message: "Invitation code valid"}
        }
        if(parseInt(code)===530565){
            functions.logger.log("Apple used invite code", code)
            return {isSuccessful: true, message: "Invitation code valid"}
        }
        let snapshot = await admin.database().ref('inviteCodes').get()
        for (const [key, val] of Object.entries(snapshot.val())) {
            if (val === parseInt(code)) {
                await admin.database().ref('inviteCodes/' + key).remove()
                console.log('sentInvitedCodes/'+key)
                await admin.database().ref('sentInvitedCodes/'+val).update({timeRedeemed: new Date()})
                functions.logger.log("Invite code verified", code)
                return {isSuccessful: true, message: "Invitation code valid"}
            }
        }

        const usedInviteCodes = (await admin.database().ref('sentInvitedCodes').get()).val()
        if(Object.keys(usedInviteCodes).includes(code.toString())){
            functions.logger.log("Invitation code already used", code)
            return {isSuccessful: false, message: "This invite code has already been used before. Please reach out to contact@wildr for a new invite code.", alreadyUsed: true}
        }else{
            functions.logger.log("Invite code not valid", code)
            return {isSuccessful: false, message: "Invitation code not valid"}
        }

    } catch (error) {
        functions.logger.error("Error getting inviteCode data", error)
        return ("Something went wrong")
    }
}

function GenerateInviteCode() {
    let code = parseInt(Math.random().toString().substr(2, 6))
    while (code.toString().length !== 6)
        code = parseInt(Math.random().toString().substr(2, 6))
    return code;
}

function SaveSingleInviteCode() {
    return new Promise((resolve, reject) => {
        let code = GenerateInviteCode();
        admin.database().ref('inviteCodes').push(code)
            .then(r => {
                functions.logger.log("New Code generated: " + code, r)
                resolve(code)
            })
            .catch(error => {
                functions.logger.error("Error getting inviteCode data", error)
                reject("Something went wrong")
            })
    })
}

function SaveMultipleInviteCodes(amount) {
    return new Promise((resolve, reject) => {
        let codes = []
        for (let i = 0; i < amount; i++) {
            codes.push(GenerateInviteCode())
        }
        let updates = {};
        codes.forEach(code => {
            let newPostKey = admin.database().ref("inviteCodes").push().key;
            updates['inviteCodes/' + newPostKey] = code;
        });
        admin.database().ref().update(updates)
            .then(() => {
                functions.logger.log("New Codes generated: ", codes)
                resolve(codes)
            })
            .catch(error => {
                functions.logger.error("Error creating multiple inviteCodes", error)
                reject("Something went wrong")
            })
    })
}

async function SendMultipleInviteCodeMails(emails) {
    let successfulEntries = {}
    try{
        let codes = await SaveMultipleInviteCodes(emails.length);
        successfulEntries.email = emails
        successfulEntries.codes = codes
        for (let i = 0; i < codes.length; i++) {
            await SendInviteCodeMail(codes[i], emails[i])
            const update = {}
            update['sentInvitedCodes/'+codes[i]] = {email: emails[i], timeSent: new Date()}
            await admin.database().ref().update(update)
            functions.logger.log(`Sent ${codes[i]} to ${emails[i]}`)
            successfulEntries.index = i
        }
        return "Emails sent"
    }
    catch (error){
        functions.logger.error("Error sending multiple inviteCodes", error)
        functions.logger.error("All data for multiple inviteCodes", successfulEntries)
        return "Something went wrong"
    }


}

function SendInviteCodeMail(code, email) {
    return new Promise((resolve, reject) => {
        client.messages.create("wildr.com", {
            from: "Wildr <contact@wildr.com>",
            to: email,
            subject: "🎉 You’ve been invited to join Wildr" + (project==="wildr-dev"?"DEV": ""),
            template: "invite_code",
            'h:X-Mailgun-Variables': JSON.stringify({code: code.toString()})
        })
            .then(res => resolve(res))
            .catch(error => reject(error))
    })
}
function GetAllCodesSent(){
    return new Promise((resolve, reject) => {
        admin.database().ref('sentInvitedCodes').get()
            .then(r=>{
                resolve(r)
            })
            .catch(error => {
                functions.logger.error("Could not check emails", error)
                reject("Error")
            })
    })
}
module.exports = {CheckInvite, SaveSingleInviteCode, SendMultipleInviteCodeMails, GetAllCodesSent}