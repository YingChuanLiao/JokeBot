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
    request(options, function(error, response, body) {
        if (error) {
            console.log(error);
        }
        try {
            let messageData = {text: body};
            sendRequest(id,messageData);
        }
        catch (err) {
            let messageData ={text: "Something went wrong, please try again."};
            console.log("error : " + err.message);
            sendRequest(id, messageData);
        }
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
    request(options, function(error, response, body) {
        if (error) {
            console.log(error.message);
        }
        else if (response.body.error){
        	console.log(response.body.error);
        }
    });
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
    request(options, function(error, response, body) {
        if (error) {
            console.log(error.message);
        }
        else if (response.body.error){
        	console.log(response.body.error);
        }
    });
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
    var options = {
  	    url: "https://graph.facebook.com/v2.6/me/message_attachments",
  	    qs : {access_token: FB_TOKEN},
        method: 'POST',
        json: {
            message:messageData
        }
    };
    request(options, function(error, response, body) {
        if (error) {
            console.log(error.message);
        }
        else if (response.body.error){
        	console.log(response.body.error);
        }
        else{
            attachment_ID = body.attachment_id;
        }
    });
}
sendStart();
uploadGIF();

// Facebook 

app.get('/webhook', function(req, res) {
	if (req.query['hub.verify_token'] === "allaroundboy") {
		res.send(req.query['hub.challenge']);
	}
	res.send("Wrong token");
});
function sendVideoMessage(id){
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
    sendRequest(id,messageData);
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
    sendRequest(id,messageData);
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
    sendRequest(id,messageData);
}

function sendQuickReply(id,text,content){
    console.log("I am QuickReply");
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
    sendRequest(id,messageData);
}

function sendText(id,text) {
    console.log("I am sendText");
    let messageData = {text: text};
    sendRequest(id,messageData);
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
    sendRequest(id,messageData);
}

function sendRequest(id,messageData){
    var options = {
  	    url: "https://graph.facebook.com/v2.6/me/messages",
  	    qs : {access_token: FB_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: id},
            message: messageData,
        }
    };
    request(options, function(error, response, body) {
        if (error) {
            console.log(error.message);
        }
        else if (response.body.error){
        	console.log(response.body.error);
        }
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
                sendAction(id);
                setTimeout(function(){
                    sendGenericMessage(id,"start");
                    sendVideoMessage(id);
                },2000);
            }
            else if(giveRating){
                var r = rating(event.message.nlp.entities.rating);
                // if user make a good/bad rating
                if (typeof(r) === 'boolean'){
                    giveRating = false;
                    let brag = "I've told you I am a joke master!";
                    let messup = "My bad";
                    sendAction(id);
                    sendText(id,r? brag:messup);
                    sendAction(id);
                    sendImage(id,r);
                    setTimeout(function(){
                        sendAction(id);
                        let content = ["More jokes", "Main Menu"];
                        sendQuickReply(id,"Wanna try other jokes?",content);
                    },4000);
                }
                // not understanding what does the user rate
                else{
                    sendAction(id);
                    sendText(id,NOTUNDERSTAND);
                    sendAction(id);
                    let content = ["good","bad"];
                    setTimeout(function(){
                        sendQuickReply(id,"Do you mean it is a good joke?",content);
                    },2000);
                } 
            }
            // more jokes (random)
            else if (text.includes("joke")){
                var keys = Object.keys(JOKEINFO);
                var topic = keys[keys.length * Math.random()<<0];
                var index = Math.random() * JOKEINFO[topic].amount<<0;
                console.log(topic+" , "+index);
                sendAction(id);
                sendText(id,JOKEINFO[topic].jokes[index].text);
                sendAction(id);
                let content = ["More jokes","Main Menu"];
                setTimeout(function(){
                    sendQuickReply(id,"Wanna try other jokes?",content);  
                },2000);
            }
            else {
                troubleCount++;
                sendAction(id);
                sendText(id,NOTUNDERSTAND);
                sendAction(id);
                setTimeout(function(){
                    if (troubleCount < TROUBLETHRESHOLD)
                        sendButtonMessage(id,FOLLOWUP,"web_url",[]);
                    else{
                        sendText(id,"It seems like you are having some trouble.");
                        sendAction(id);
                        setTimeout(function(){
                            let content = ["Main Menu"];
                            sendQuickReply(id,"Press the button to go back to the main Menu!",content);
                        },1000);
                    }
                },2000);
            }
        }
    }
    else if(event.postback && event.postback.payload){
        firstVisit = false;
        //event.postback : { payload: 'good', title: 'good joke' }
        console.log(event.postback);
        troubleCount = 0;
        if (event.postback.title == "Get Started"){
            sendAction(id);
            setTimeout(function(){
                sendGenericMessage(id,"start");
                sendVideoMessage(id);
            },2000);
        }
        else if (event.postback.payload == "first"){
            readJokeCount++;
            sendAction(id);
            sendJokes(id);
            setTimeout(function(){
                sendAction(id);
                sendText(id,ASKJOKES);
                sendAction(id);
                sendGenericMessage(id,"jokes");
            },300);
        }
        else{
            readJokeCount++;
            let index = Math.random() *JOKEINFO[event.postback.payload].amount << 0;
            sendAction(id);
            sendText(id,JOKEINFO[event.postback.payload].jokes[index].text);
            if (readJokeCount == 2){
                setTimeout(function(){
                    sendAction(id);
                    sendText(id,"How do you feel about my joke?");
                },300);
                giveRating = true;
            }
            else{
                let content = ["More jokes","Main Menu"];
                setTimeout(function(){
                    sendQuickReply(id,"Wanna try other jokes?",content);  
                },2000);
                
            }
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
