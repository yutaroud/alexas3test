const AWS = require('aws-sdk');
AWS.config.loadFromPath('./rootkey.json');
AWS.config.update({region: 'ap-northeast-1'});
const s3 = new AWS.S3();
const dstBucket = process.env.S3_BUCKET_NAME;
const Alexa = require('ask-sdk-core');
let skill;
exports.handler = async function (event, context) {
    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .addRequestHandlers(
                LaunchRequestHandler,
                UnhandledHandler,
                HelpIntentHandler,
                CancelAndStopIntentHandler,
                SessionEndedRequestHandler
            )
            .create();
    }
    return skill.invoke(event);
};



const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        // LaunchRequestの処理
        return new Promise((resolve) => {
                writeToS3("言葉").then(() => {
                    resolve(handlerInput.responseBuilder
                        .speak("無事にアップロードすることができました。")
                        .getResponse());
                });
        });
    },
};


//ここから先はデフォルトのハンドラー設定
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        let speechText = "このスキルは〜〜するためのスキルです。";

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    },
};


const UnhandledHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'Unhandled';
    },
    handle(handlerInput) {

        const reprompt   = "もう一回どうぞ";
        const speechText = "よくわかりませんでした。もう一回どうぞ";

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(reprompt)
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
            || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak("またね")
            .getResponse();
    },
};

function writeToS3(txt) {
    let timestamp = nowtime();

    let result = new Promise((resolve, reject) => {

        const putParams = {
            Bucket: dstBucket,
            Key: 'test.txt',
            Body: txt + "," + timestamp
        };

        s3.putObject(putParams, function (putErr, putData) {
            if (putErr) {
                console.log("エラーです。");
                console.error(putErr);
                reject(putErr);
            }else {
                console.log('S3 Upload complete');
                resolve(putData);
            }
        });
        console.log("Uploading To S3")
    });

    return result;

}

function nowtime(){
    today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let hour = today.getHours() + 9;
    let minute = today.getMinutes();
    let second = today.getSeconds();
    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second
}
