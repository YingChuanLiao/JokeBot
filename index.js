'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const util = require("./util.js");
var jokeSet = require("./joke/jokeSet.js");
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//***************************************************************
//routes

app.get('/', function(req, res) {
	res.send("hi I am a jokebot");
});

app.get('/webhook', function(req, res) {
	if (req.query['hub.verify_token'] === "allaroundboy") {
		res.send(req.query['hub.challenge']);
	}
	res.send("Wrong token");
});

app.post('/webhook',handleMessage);
//***************************************************************
//global variables
const WIT_TOKEN = "52X7TGVRNEDN3A7JPWXHSH23KUW4EJLW";
const FB_TOKEN = "EAACNdAhOSBABAOPRZAgCeKevb7rfCABo41HtJjY3toe9EnhfcIJTIrIlsdRsBdZCjt0mQvQr9OgibodwtiS2TqPiyHIe86He5fUtty0D9qbnZAflSe8OASLTyIejFYGCMtkKz3Nr5tAePFaKxrwRZA4GHZAmfODeXd25yLIHGGbfOgkEaDuZCZC";
const GREETINGS = "Hello! I am a joke master. Bringing happiness to people is always my pleasure."; 
const CLICKME = "Click me!!";
const NOTUNDERSTAND = "Sorry I am not understanding what you're saying.";
const FOLLOWUP = "As an employee in facebook I suppose not to recommend this tool to you. Please don't tell Mark Zuckerberg";
const ASKJOKES = "Well, I can also tell three kinds of jokes. Which one would you like to hear?";
const TROUBLETHRESHOLD = 3;
const SWTICHTHRESHOLD = 3;
let askWithSimpson = false;
let firstVisit = true;
let totalJokeCount = 0;
let giveRating = false;
let troubleCount = 0;
let currentTopic = "";
let preference ={};
let jokesInfo = jokeSet.jokesInfo;
let otherJokesInfo = jokeSet.otherJokesInfo;

//***************************************************************
// send jokes from external API
function sendJokes(id){
    let options = {
        url: "https://icanhazdadjoke.com/",
        headers: {
            'Accept': 'text/plain',
        }
    };
    return new Promise((resolve, reject) => {
        request (options, (error, response, body) => {
            if (error) { 
                console.log("Error sending message: " +error); 
                return reject(response.error); 
            }
            else if (response.body.error) { 
                console.log('Response body Error: ' + response.body.error); 
                return reject(response.body.error); 
            }
            let messageData = {text:body};
            return resolve(sendRequest(id,messageData));
        });    
    });
}

//***************************************************************
// Facebook message templates
function sendAction(id){
    let options = {
  	    url: "https://graph.facebook.com/v2.6/me/messages",
  	    qs : {access_token: FB_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: id},
            sender_action: "typing_on"
        }
    };
    return manageResponse(options);
}

function sendStart(){
    let options = {
  	    url: "https://graph.facebook.com/v2.6/me/messenger_profile",
  	    qs : {access_token: FB_TOKEN},
        method: 'POST',
        json: {
            get_started:{
                payload:"get started"
            }
        }
    };
    return manageResponse(options);
}

function uploadGIF(){
    let messageData = {
        "attachment":{
            "type":"image", 
            "payload":{
                "is_reusable": true,
                "url":"https://media.giphy.com/media/l0G18FLvd5Y3wa1G0/giphy.gif"
            }
        }
    };
    let options = {
  	    url: "https://graph.facebook.com/v2.6/me/message_attachments",
  	    qs : {access_token: FB_TOKEN},
        method: 'POST',
        json: {
            message:messageData
        }
    };
    return new Promise((resolve, reject) => {
        request (options, (error, response, body) => {
            if (error) { 
                console.log("Error sending message: " + error); 
                return reject(response.error); 
            }
            else if (response.body.error) { 
                console.log('Response body Error: ' + response.body.error); 
                return reject(response.body.error); 
            }
            return resolve(body.attachment_id);
        });    
    });
}
sendStart();
let promise = uploadGIF();
function sendVideoMessage(id,attachment_ID,text){
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "media",
                "elements": [{
                    "media_type": "image",
                    "attachment_id": attachment_ID,
                    "buttons":[{
                        "type":"postback",
                        "payload": "first joke",
                        "title":text
                        }
                    ]
                }]
            }
        }
    };
    return sendRequest(id,messageData);
}

function sendGenericMessage(id,info){
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"generic",
                "elements":[
                    {
                    "title":"",
                    "subtitle":"",
                    }
                ]
            }
        }
    };
    let myelement = [];
    if (info.purpose == "start"){
        let content = {}; 
        content["title"] = "Joke Master";
        content["subtitle"] = info.text;
        myelement.push(content);
    }
    else if (info.purpose == "jokes"){
        for (let key in info.jokes){
            let content = {};
            content["title"] = key,
            content["image_url"] = info.jokes[key].url;
            content["subtitle"] = info.jokes[key].subtitle;
            content["buttons"] = [
                {
                "type":"postback",
                "payload": key,
                "title": key
                }
            ];
            myelement.push(content);
        }
    }
    messageData.attachment.payload.elements = myelement;
    return sendRequest(id,messageData);
}


function sendImage(id,isgoodJoke){
    let happyURL = "https://media.giphy.com/media/3o6MbrG9RNjQuytGXm/giphy.gif";
    let sadURL = "https://media.giphy.com/media/2rtQMJvhzOnRe/giphy.gif";
    let messageData ={
        "attachment":{
            "type":"image", 
            "payload":{
                "url": isgoodJoke? happyURL:sadURL,
                "is_reusable":true
            }
        }
    }; 
    return sendRequest(id,messageData);
}

function sendQuickReply(id,text,content){
    let messageData = {
        text: text,
        quick_replies:[]
    };
    let qr = messageData.quick_replies;
    content.forEach(function(r){
        qr.push({
            content_type:"text",
            title:r,
            payload:"rating",
        });
    });
    return sendRequest(id,messageData);
}

function sendText(id,text) {
    let messageData = {text: text};
    return sendRequest(id,messageData);
}
function sendButtonMessage(id,text,type,buttonContent){
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":text,
                "buttons":[]
            }
        }
    };
    let buttons = messageData.attachment.payload.buttons;
    if (type == "postback"){
        buttonContent.forEach(function(content){
            buttons.push({
                type: type,
                payload: content,
                title: content
            });
            
        });
    }
    else if (type == "web_url"){
        buttons.push({
            type:type,
            url:"https://translate.google.com/m/translate",
            title:"Google Translate"
        });
    }
    return sendRequest(id,messageData);
}

function sendRequest (userId,messageData){
    let options = {
  	    url: "https://graph.facebook.com/v2.6/me/messages",
  	    qs : {access_token: FB_TOKEN},
        method : "POST",
        json : {
            recipient: { id : userId },
            message: messageData,
        }
    };
    return manageResponse(options);
}

function manageResponse(options){
    return new Promise((resolve, reject) => {
        request (options, (error, response, body) => {
            if (error) { 
                console.log("Error sending message: " + error); 
                return reject(error); 
            }
            else if (response.body.error) { 
                console.log('Response body Error: ' + response.body.error); 
                return reject(response.body.error); 
            }
            return resolve();
        });    
    });
}
//***************************************************************
// handle messages

function handleMessage(req, res){
    let event = req.body.entry[0].messaging[0];
    let id = event.sender.id;
    if (event.message){
        //fs.writeFileSync("message",JSON.stringify(event,null,2));
        if (event.message.text) {
            let text = event.message.text.toLowerCase().trim();
            // If it is the user's first visit, or it clicks the menu button, or type words including "menu"
            if (firstVisit || text.includes("menu")){
                troubleCount = 0;
                if (firstVisit)
                    firstVisit = false;
                sendAction(id).then(function(){
                    let info= {
                        purpose:"start",
                        text:GREETINGS
                    };
                    return sendGenericMessage(id,info);
                }).then(function(){
                    return promise;
                }).then(function(videoID){
                    return sendVideoMessage(id,videoID,CLICKME);
                }).catch(function(err){
                    console.log(err);
                });
            }
            // If the user is allowed to give ratings
            else if(giveRating){
                let r = util.rating(event.message.nlp.entities.rating);
                // If the content can be recognized by Wit.ai
                if (typeof(r) === 'boolean'){
                    giveRating = false;
                    if (askWithSimpson){
                        askWithSimpson = false;
                        let brag = "I've told you I am a joke master!";
                        let messup = "My bad";
                        sendAction(id).then(function(){
                            return sendText(id,r? brag:messup);
                        }).then(function(){
                            return sendAction(id);
                        }).then(function(){
                            return sendImage(id,r);
                        }).then(function(){
                            return sendAction(id);
                        }).then(function(){
                            util.giveScore(r,preference,currentTopic);
                            return sendAction(id);
                        }).then(function(){
                            let content = ["More Jokes", "Main Menu","Comment History"];
                            return sendQuickReply(id,"Wanna try other jokes?",content);
                        }).catch(function(err){
                            console.log(err);
                        });
                    }
                    else{
                        util.giveScore(r,preference,currentTopic);   
                        sendAction(id).then(function(){
                            let content = ["More Jokes", "Main Menu","Comment History"];
                            return sendQuickReply(id,"Wanna try other jokes?",content);
                        }).catch(function(err){
                            console.log(err);
                        });
                    }
                }
                // Wit.ai does not understand what does the user mean, so use buttons to narrow down
                else{
                    sendAction(id).then(function(){
                        return sendText(id,NOTUNDERSTAND);
                    }).then(function(){
                        return sendAction(id);
                    }).then(function(){
                        let content = ["good","bad"];
                        return sendQuickReply(id,"Do you mean it is a good joke?",content);
                    }).catch(function(err){
                        console.log(err);
                    });
                } 
            }
            // if user click "more jokes" button or type words inclding "joke"
            else if (text.includes("joke")){
                totalJokeCount++;
                let keys = Object.keys(jokesInfo);
                currentTopic = keys[keys.length * Math.random()<<0];
                let index = Math.random() * jokesInfo[currentTopic].amount<<0;
                sendAction(id).then(function(){
                    return sendText(id,jokesInfo[currentTopic].jokes[index].text);
                }).then(function(){
                    return sendAction(id);
                }).then(function(){
                    let content = ["😂","🙄"];
                    giveRating = true;
                    return sendQuickReply(id,"Comment!",content);
                });
            }
            // if user click "comment history" button or type words inclding "history"
            else if (text.includes("history")){
                sendAction(id).then(function(){
                    let preferenceEmoji = JSON.parse(JSON.stringify(preference));
                    for (let key in preferenceEmoji){
                        if(preferenceEmoji[key]<0){
                            preferenceEmoji[key] = "🙄";
                        }
                        else if (preferenceEmoji[key] > 0){
                            preferenceEmoji[key] = "😂";
                        }
                        else{
                            preferenceEmoji[key] = "🤔";
                        }
                    }
                    
                    return sendText(id,JSON.stringify(preferenceEmoji,null,2));
                }).then(function(){
                    let content = ["More Jokes", "Main Menu","Comment History"];
                    return sendQuickReply(id,"Wanna try other jokes?",content);
                }).catch(function(err){
                    console.log(err);
                });
            }
            // users response is unexpectable"
            else {
                troubleCount++;
                sendAction(id).then(function(){
                    return sendText(id,NOTUNDERSTAND);
                }).then(function(){
                    return sendAction(id);
                }).then(function(){
                    if (troubleCount < TROUBLETHRESHOLD)
                        return sendButtonMessage(id,FOLLOWUP,"web_url",[]);
                    else{
                        return sendText(id,"It seems like you are having some trouble.").then(function(){
                            return sendAction(id);
                        }).then(function(){
                            let content = ["Main Menu"];
                            return sendQuickReply(id,"Press the button to go back to the main Menu!",content);
                        });
                    }
                }).catch(function(err){
                    console.log(err);
                });
            }
        }
    }
    else if(event.postback && event.postback.payload){
        firstVisit = false;
        troubleCount = 0;
        // if users click "get started" button
        if (event.postback.payload == "get started"){
            sendAction(id).then(function(){
                let info= {
                    purpose:"start",
                    text:GREETINGS
                };
                return sendGenericMessage(id,info);
            }).then(function(){
                return promise;
            }).then(function(videoID){
                return sendVideoMessage(id,videoID,CLICKME);
            }).catch(function(err){
                console.log(err);
            });
        }
        // if users click "click me" button, whose payload property is "first joke"
        else if (event.postback.payload == "first joke"){
            sendAction(id).then(function(){
                if (totalJokeCount >= SWTICHTHRESHOLD){
                    totalJokeCount = 0;
                    let needSwitch = util.switchTopics(preference,jokesInfo,otherJokesInfo);
                    if (needSwitch)
                        return sendText(id,"Hmm seems like you don't like certain topics... let me change it");
                }
                else{
                    return sendJokes(id,event);
                }
            }).then(function(){
                return sendAction(id);
            }).then(function(){
                return sendText(id,ASKJOKES);
            }).then(function(){
                return sendAction(id);
            }).then(function(){
                let info= {
                    purpose:"jokes",
                    jokes:jokesInfo
                };
                return sendGenericMessage(id,info);
            }).catch(function(err){
                console.log(err);
            });
        }
        // users choose the type of jokes he would like to hear
        else{
            currentTopic = event.postback.payload;
            askWithSimpson = true;
            totalJokeCount++;
            let index = Math.random() *jokesInfo[currentTopic].amount << 0;
            sendAction(id).then(function(){
                return sendText(id,jokesInfo[currentTopic].jokes[index].text);
            }).then(function(){
                return sendAction(id);
            }).then(function(){
                giveRating = true;
                return sendText(id,"How do you feel about my joke? Give any comments you like!");
            }).catch(function(err){
                console.log(err);
            });
        }

    }
    res.end("received!");
}

app.listen(app.get('port'), function() {
	console.log("running: port");
});
