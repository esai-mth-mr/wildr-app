// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
const axios = require("axios");
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.lambdaHandler = async (event, context) => {
    try {
        axios.post("http://dev.api.wildr.com:6000/admin/user/lift-embargo")
            .then(r => {
                console.log(r.data)
                return {
                    'statusCode': 200,
                    'body': JSON.stringify({
                        message: r.data,
                        // location: ret.data.trim()
                    })
                }
            })
            .catch((e) => {
                console.log(e)
                return {
                    'statusCode': 500,
                    'body': JSON.stringify({
                        message: e,
                    })
                }
            })

    } catch (err) {
        return err;
    }

};
