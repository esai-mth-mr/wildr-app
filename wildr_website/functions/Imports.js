const functions = require("firebase-functions");
const admin = require("firebase-admin");
const envFile = JSON.parse(Buffer.from(functions.config().wildr.config, 'base64').toString());

admin.initializeApp({
    credential: admin.credential.cert(envFile.adminSDK),
    databaseURL: envFile.databaseURL
});
const recaptchaKey = envFile.recaptchaKey
const recaptchaV2Key = envFile.recaptchaV2Key
const project = envFile.adminSDK.project_id
const mailGunAuth = {
    apiKey: envFile.mailGunApiKey,
    domain: envFile.mailGunDomain
};
const inviteCodeKey = envFile.inviteCodeKey
module.exports = {functions, admin, recaptchaKey, recaptchaV2Key, project, mailGunAuth, inviteCodeKey}