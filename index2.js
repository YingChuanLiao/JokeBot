'use strict';
const test = "test";
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require("fs");
//const cheerio = require("cheerio");
//const {Wit, log} = require('node-wit');
const app = express();
app.set('port', (process.env.PORT || 5000));
// Allows us to process the data
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
let nerdJokes = JSON.parse(fs.readFileSync("nerd.txt","utf8"));
let mathJokes = JSON.parse(fs.readFileSync("math.txt","utf8"));
let dumbJokes = JSON.parse(fs.readFileSync("dumb.txt","utf8"));

let JOKEINFO ={
    "nerd":{
        url: "https://i.pinimg.com/736x/bb/16/31/bb163181363bd02bdab24468ff05aa7c.jpg",
        subtitle:"You can always see different groups of people gathered in the schoolyard. We have the jocks, the goth, and so on. I dedicate these nerd jokes to all the nerds out there. Without them, we would not have the technology we have today, iPhones, cars, computer and so on. I myself was a bit of a nerd and hey I’m fine today.",
        jokes: nerdJokes,
        amount: nerdJokes.length
        
    },
    "math":{
        url: "http://i.telegraph.co.uk/multimedia/archive/03216/simpsons_3216501b.jpg",
        subtitle:"Hello and welcome to math jokes. Here you will find funny, clever, silly and just plain weird jokes about math. Some of these jokes require some basic mathematic knowledge of mathematics otherwise, you are good to go. Enjoy.",
        jokes: mathJokes,
        amount: mathJokes.length
    },
    "dumb":{
        url: "http://images5.fanpop.com/image/polls/879000/879118_1321284665324_full.jpg",
        subtitle:"Here is a category which consist only of dumb jokes. They are so dumb that they are on the verge of being funny. Don’t believe me? Read them and decide for yourself.",
        jokes: dumbJokes,
        amount: dumbJokes.length
    }
};

// ROUTES

app.get('/', function(req, res) {
	res.send("hi I am a jokerbot");
});
const WIT_TOKEN = "52X7TGVRNEDN3A7JPWXHSH23KUW4EJLW";
const FB_TOKEN = "EAACNdAhOSBABAOPRZAgCeKevb7rfCABo41HtJjY3toe9EnhfcIJTIrIlsdRsBdZCjt0mQvQr9OgibodwtiS2TqPiyHIe86He5fUtty0D9qbnZAflSe8OASLTyIejFYGCMtkKz3Nr5tAePFaKxrwRZA4GHZAmfODeXd25yLIHGGbfOgkEaDuZCZC";
const GREETINGS = "Hello! I am a joke master. Bringing happiness to people is always my pleasure."; 
const STARTFIRSTJOKE = "Click button to get a joke!";
const NOTUNDERSTAND = "Sorry I am not understanding what you're saying.";
const FOLLOWUP = "As a employee in facebook I suppose not to recommend this tool to you. Please don't tell Mark Zuckerberg";
const ASKJOKES = "Well, I can also tell three kinds of jokes. Which one would you like to hear?";
const TROUBLETHRESHOLD = 3;
let firstVisit = true;
let readJokeCount = 0;
let giveRating = false;
let troubleCount = 0;
let attachment_ID = "";

function rating(rateInfo){
    // if user do not rate
    if (!rateInfo) return null;
    for (var i = 0; i < rateInfo.length; i++){
        if (rateInfo[i].value == "good" && rateInfo[i].confidence > 0.5)
            return true;
        else if (rateInfo[i].value == "bad" && rateInfo[i].confidence > 0.5)
            return false;
    }
    // if the user' ratings do not indicate good or bad
    return null;
}

function sendJokes(id){
    var options = {
        url: "https://icanhazdadjoke.com/",
        headers: {
            'Accept': 'text/plain',
        }
    };
    return new Promise((resolve, reject) => {
        request (options, (error, response, body) => {
            if (error) { 
                console.log("Error sending message: " + response.error); 
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

function sendAction(id){
    var options = {
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
    var options = {
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
    console.log("I am upload");
    let messageData = {
        "attachment":{
            "type":"image", 
            "payload":{
                "is_reusable": true,
                "url":"https://media.giphy.com/media/l0G18FLvd5Y3wa1G0/giphy.gif"
            }
        }
    };
    var options = {
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
                console.log("Error sending message: " + response.error); 
                return reject(response.error); 
            }
            else if (response.body.error) { 
                console.log('Response body Error: ' + response.body.error); 
                return reject(response.body.error); 
            }
            //attachment_ID = body.attachment_id;
            return resolve(body.attachment_id);
        });    
    });
}
sendStart();
var promise = uploadGIF();

// Facebook 

app.get('/webhook', function(req, res) {
	if (req.query['hub.verify_token'] === "allaroundboy") {
		res.send(req.query['hub.challenge']);
	}
	res.send("Wrong token");
});
function sendVideoMessage(id,attachment_ID){
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
                        "payload": "first",
                        "title":"Yes! give me jokes!!"
                        }
                    ]
                }]
            }
        }
    };
    return sendRequest(id,messageData);
}




function sendGenericMessage(id,purpose){
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
    //let element = messageData.attachment.payload.elements; 
    var myelement = [];
    if (purpose == "start"){
        let content = {}; 
        content["title"] = "Joke Master";
        content["subtitle"] = GREETINGS;
        myelement.push(content);
    }
    else if (purpose == "jokes"){
        for (var key in JOKEINFO){
            let content = {};
            content["title"] = key,
            content["image_url"] = JOKEINFO[key].url;
            content["subtitle"] = JOKEINFO[key].subtitle;
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

//  send image url
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
                title: content+ " joke"
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
    var options = {
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


function handleMessage(req, res){
    //console.log(req.body);
    let event = req.body.entry[0].messaging[0];
    let id = event.sender.id;
    if (event.message){
        fs.writeFileSync("message",JSON.stringify(event,null,2));
        //console.log(JSON.stringify(event));
        if (event.message.text) {
            let text = event.message.text.toLowerCase().trim();
            console.log("someone says: " + text);
            if (firstVisit || text.includes("menu")){
                troubleCount = 0;
                if (firstVisit)
                    firstVisit = false;
                sendAction(id).then(function(){
                    return sendGenericMessage(id,"start");
                }).then(function(){
                    // should handle the issue
                    // write another promise!
                    return promise;
                }).then(function(videoID){
                    console.log(videoID);
                    return sendVideoMessage(id,videoID);
                    //while(attachment_ID != ""){
                        // console.log("frfoijroifjrif4");
                        // return sendVideoMessage(id);
                    //}
                }).catch(function(err){
                    console.log(err);
                });
            }
            else if(giveRating){
                var r = rating(event.message.nlp.entities.rating);
                // if user make a good/bad rating
                if (typeof(r) === 'boolean'){
                    giveRating = false;
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
                        let content = ["More jokes", "Main Menu"];
                        return sendQuickReply(id,"Wanna try other jokes?",content);
                    }).catch(function(err){
                        console.log(err);
                    });
                }
                // not understanding what does the user rate
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
            // more jokes (random)
            else if (text.includes("joke")){
                var keys = Object.keys(JOKEINFO);
                var topic = keys[keys.length * Math.random()<<0];
                var index = Math.random() * JOKEINFO[topic].amount<<0;
                sendAction(id).then(function(){
                    return sendText(id,JOKEINFO[topic].jokes[index].text);
                }).then(function(){
                    return sendAction(id);
                }).then(function(){
                    let content = ["More jokes","Main Menu"];
                    return sendQuickReply(id,"Wanna try other jokes?",content); 
                });
            }
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
                        // there is a issue
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
        //event.postback : { payload: 'good', title: 'good joke' }
        troubleCount = 0;
        if (event.postback.title == "Get Started"){
            sendAction(id).then(function(){
                return sendGenericMessage(id,"start");
            }).then(function(){
                return promise;
            }).then(function(videoID){
                return sendVideoMessage(id,videoID);
            }).catch(function(err){
                console.log(err);
            });
        }
        else if (event.postback.payload == "first"){
            readJokeCount++;
            sendAction(id).then(function(){
                return sendJokes(id,event);
            }).then(function(){
                return sendAction(id);
            }).then(function(){
                return sendText(id,ASKJOKES);
            }).then(function(){
                return sendAction(id);
            }).then(function(){
                return sendGenericMessage(id,"jokes");
            }).catch(function(err){
                console.log(err);
            });
        }
        else{
            // send second joke if he does not give a rating
            readJokeCount++;
            // random pick one jokes from the jokeSet
            let index = Math.random() *JOKEINFO[event.postback.payload].amount << 0;
            sendAction(id).then(function(){
                return sendText(id,JOKEINFO[event.postback.payload].jokes[index].text);
            }).then(function(){
                return sendAction(id);
            }).then(function(){
                if (readJokeCount == 2){
                    giveRating = true;
                    return sendText(id,"How do you feel about my joke?");
                }
                else{
                    let content = ["More jokes","Main Menu"];
                    return sendQuickReply(id,"Wanna try other jokes?",content); 
                }
            }).catch(function(err){
                console.log(err);
            });
        }

    }
    res.end("received!");
}

app.post('/webhook',handleMessage);
//The Messenger Platform sends events to your webhook to notify your bot when a variety of interactions 
// or events happen,including when a person sends a message. Webhook events are sent by the Messenger Platform 
//as POST requests to your webhook.
app.listen(app.get('port'), function() {
	console.log("running: port");
})
