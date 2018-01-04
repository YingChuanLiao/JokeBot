'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require("fs");
//const cheerio = require("cheerio");
const {Wit, log} = require('node-wit');
const app = express();
const deferred = require("deferred");
app.set('port', (process.env.PORT || 5000));
// Allows us to process the data
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
let nerdJokes = JSON.parse(fs.readFileSync("nerd.txt","utf8"));
let mathJokes = JSON.parse(fs.readFileSync("math.txt","utf8"));
let dumbJokes = JSON.parse(fs.readFileSync("dumb.txt","utf8"));

// edit JOKETYPE
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


const JOKETYPE = ["nerd","math","dumb"];
// JOKETYPE.forEach(function(type){
//     console.log(type);
//     var url = "https://top-funny-jokes.com/"+type+"-jokes/";
//     request(url, function(err,response,body){
//         var $ = cheerio.load(body);
//         var jokes = $(".su-list.su-list-style- ul li");
//         var count = 0;
//         //console.log(jokes.text());
//         //var data = [];
//         jokes.each(function(){
//             jokeSet[type][count++] = $(this).text();// issue: sometimes the scraping will fail.
            
//             // var obj = {
//             //     type: type,
//             //     text: $(this).text()
//             // };
//             // data.push(obj);
//             //console.log(type);
//             //console.log($(this).text());
//             if (count == 10){return false;}
//         });
//         //fs.appendFileSync(type+".txt",JSON.stringify(data,null,2));
//     });
// });

// ROUTES

app.get('/', function(req, res) {
	res.send("hi I am a jokerbot");
});
let WIT_TOKEN = "52X7TGVRNEDN3A7JPWXHSH23KUW4EJLW";
let FB_TOKEN = "EAACNdAhOSBABAOPRZAgCeKevb7rfCABo41HtJjY3toe9EnhfcIJTIrIlsdRsBdZCjt0mQvQr9OgibodwtiS2TqPiyHIe86He5fUtty0D9qbnZAflSe8OASLTyIejFYGCMtkKz3Nr5tAePFaKxrwRZA4GHZAmfODeXd25yLIHGGbfOgkEaDuZCZC";
let GREETINGS = "Hello! I am a joke master. Bringing happiness to people is always my pleasure."; 
let STARTFIRSTJOKE = "Click button to get a joke!";
let NOTUNDERSTAND = "Sorry I am not understanding what you're saying.";
let FOLLOWUP = "As a employee in facebook I suppose not to recommend this tool to you. Please don't tell Mark Zuckerberg";
let ASKJOKES = "Well, I can also tell three kinds of jokes. Which one would you like to hear?";
let firstVisit = true;
let readJokeCount = 0;
let giveRating = false;
let troubleCount = 0;
let troubleThreshold = 3;
let attachment_ID = "";

function sendStart(){
    firstVisit = false;
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
sendStart();
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
            attachment_ID = body.attachment_id;
            console.log(body);
            console.log("Message sent successfully in uploadGIF "); 
            return resolve(response);
        });    
    });
}
uploadGIF();






// Facebook 

app.get('/webhook', function(req, res) {
	if (req.query['hub.verify_token'] === "allaroundboy") {
		res.send(req.query['hub.challenge']);
	}
	res.send("Wrong token");
});
function sendVideoMessage(id){
    console.log("sendVideoMessage");
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
                        "title":"get a joke"
                        }
                    ]
                }]
            }
        }
    };
    return sendR(id,messageData);
}




function sendGenericMessage(id,purpose){
    console.log("sendGenericMessage");
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"generic",
                "elements":[
                    {
                    "title":"Joke Master",
                    //"image_url":"https://media.giphy.com/media/l0G18FLvd5Y3wa1G0/giphy.gif",
                    "subtitle":GREETINGS,
                    //"buttons":[
                        // {
                        // "type":"postback",
                        // "payload": "first",
                        // "title":"get a joke"
                        // }
                    //]
                    }
                ]
            }
        }
    };
    let element = messageData.attachment.payload.elements; 
    if (purpose == "start"){
        element.title = "Joke Master";
        element.subtitle = GREETINGS;
    }
    else if (purpose == "jokes"){
        var myelement = [];
        for (var key in JOKEINFO){
        //JOKEINFO.forEach(function(obj){
            var content = {};
            content["title"] = key,
            content["image_url"] = JOKEINFO[key].url;
            content["subtitle"] = JOKEINFO[key].subtitle;
            content["buttons"] = [
                {
                "type":"postback",
                "payload": key,
                "title":key
                }
            ];
            myelement.push(content);
        }
        messageData.attachment.payload.elements = myelement;
    }
    
    return sendR(id,messageData);
}
//edit





//  send image url
function sendImage(id,isgoodJoke){
    let happyURL = "https://media.giphy.com/media/3o6MbrG9RNjQuytGXm/giphy.gif";
    let sadURL = "https://media.giphy.com/media/2rtQMJvhzOnRe/giphy.gif";
    let startURL = "https://media.giphy.com/media/l0G18FLvd5Y3wa1G0/giphy.gif";
    let messageData ={
        "attachment":{
            "type":"image", 
            "payload":{
                "url": typeof(isgoodJoke) == "boolean"? isgoodJoke? happyURL:sadURL: startURL,
                "is_reusable":true
            }
        }
    };
    return sendR(id,messageData);
}

function sendQuickReply(id,text,content){
    console.log("I am QuickReply");
    let messageData = {
        text: text,
        quick_replies:[]
        //   {
        //     content_type:"text",
        //     title:[],
        //     payload:"rating",
        //   },
    };
    let qr = messageData.quick_replies;
    content.forEach(function(r){
        qr.push({
            content_type:"text",
            title:r,
            payload:"rating",
        });
    });
    return sendR(id,messageData);
}





function sendText(id,text) {
    console.log("I am sendText");
    let messageData = {text: text};
    return sendR(id,messageData);
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
    return sendR(id,messageData);
}
function sendJokes(id,event){
    var options = {
        url: "https://icanhazdadjoke.com/",
        //json: true, // specify return format
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
            console.log("Message sent successfully in  sendJokes");
            return resolve(sendR(id,messageData));
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

// function sendRequest(id,messageData){
//     var options = {
//   	    url: "https://graph.facebook.com/v2.6/me/messages",
//   	    qs : {access_token: FB_TOKEN},
//         method: 'POST',
//         json: {
//             recipient: {id: id},
//             message: messageData,
//         }
//     };
//     request(options, function(error, response, body) {
//         if (error) {
//             console.log(error.message);
//         }
//         else if (response.body.error){
//         	console.log(response.body.error);
//         }
//         else{
//             console.log(body);
//         }
//     });
// }
function sendR (userId,messageData){
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
    console.log(options);
    return new Promise((resolve, reject) => {
        request (options, (error, response, body) => {
            if (error) { 
                console.log("Error sending message: " + error); 
                return reject("no"); 
            }
            else if (response.body.error) { 
                console.log('Response body Error: ' + response.body.error); 
                return reject("no"); 
            }
            console.log("Message sent successfully to "); 
            return resolve("hi");
        });    
    });
}



function doNext(previousValue) {
    var dfd = new deferred();
 
    // perform some async logic; resolve the promise
    //setTimeout(function () {
        var next = String.fromCharCode(previousValue.charCodeAt(previousValue.length - 1) + 1);
        dfd.resolve(previousValue + next);
    //}, 50);
 
    return dfd.promise;
}
 
var promise = doNext('a');
 
for (var i = 0; i < 9; i++) {
    promise = promise.then(doNext);
}
 
promise.then(function (finalResult) {
    // 'doNext' will have been invoked 10 times, each
    // invocation only occurring after the previous one completed
 
    // 'finalResult' will be the value returned
    // by the last invocation of 'doNext': 'abcdefghijk'
    console.log(finalResult);
});






// used for query app
app.get("/query/:q",function(req,res){
  const client = new Wit({
    accessToken: WIT_TOKEN,
    logger: new log.Logger(log.DEBUG)
  });
  client.message(req.params.q, {})
  .then((data) => {
    //console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
    res.send(JSON.stringify(data));
  })
  .catch(console.error);

});

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
            if(giveRating){
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
            else if (text.includes("menu")){
                sendAction(id).then(function(){
                    return sendGenericMessage(id,"start");
                }).then(function(data){
                    return sendVideoMessage(id);
                }).catch(function(err){
                    console.log(err);
                });
            }
            // This design is kinda weird. Because there is only one chance for free-text....
            else {
                troubleCount++;
                sendAction(id).then(function(){
                    return sendText(id,NOTUNDERSTAND);
                }).then(function(){
                    return sendAction(id);
                }).then(function(){
                    if (troubleCount < troubleThreshold)
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
        //event.postback : { payload: 'good', title: 'good joke' }
        console.log(event.postback);
       // if it is the first time
        troubleCount = 0;
        if (event.postback.title == "Get Started"){
            sendAction(id).then(function(){
                return sendGenericMessage(id,"start");
            }).then(function(data){
                return sendVideoMessage(id);
            }).catch(function(err){
                console.log(err);
            });
        }
        else if (event.postback.payload == "first"){
        // else if (readJokeCount == 0){
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
            }).catch(function(err){
                console.log(err);
            });
            //if (readJokeCount == 2){
            sendAction(id).then(function(){
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
            //}
            //else{
                //let content = ["More jokes","Main Menu"];
                //setTimeout(function(){
                    //sendQuickReply(id,"Wanna try other jokes?",content);  
                //},2000);
                
            //}
            // sendText(id,JOKEINFO[event.postback.payload].jokes[index].text); // becuase the payload is joke!
            // if (readJokeCount == 2){
            //     //setTimeout(function(){
            //         sendAction(id);
            //         sendText(id,"How do you feel about my joke?");
            //     //},300);
            //     giveRating = true;
            // }
            // else{
            //     let content = ["More jokes","Main Menu"];
            //     //setTimeout(function(){
            //         sendQuickReply(id,"Wanna try other jokes?",content);  
            //     //},2000);
                
            // }
        } 
    }
    res.end("received!");
}




app.post('/webhook',handleMessage);
//The Messenger Platform sends events to your webhook to notify your bot when a variety of interactions 
// or events happen,including when a person sends a message. Webhook events are sent by the Messenger Platform 
//as POST requests to your webhook.
























function wikibot(query, userid) {
  var queryUrl = "https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=10&prop=extracts&exintro&explaintext&exsentences=5&exlimit=max&gsrsearch=" + query;
  var myTemplate = {
    recipient: {
      id: userid
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: []
        }
      }
    }
  };
  var options = {
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: FB_TOKEN},
    method: 'POST',
    body: myTemplate,
    json: true
  };
  // send request to wiki api
  request(queryUrl, function(error, response, body) {
    if (error) {
      console.log(error);
    }
    try {
      body = JSON.parse(body);
      console.log(body);// wiki api information printed
      var pages = body.query.pages;
      //console.log("pages : "+ JSON.stringify(pages));
      for (var i in pages) {
        // message.attachment.payload.elements
        // requirement: title
        var myelement = {
          title: "",
          subtitle: "",
          // message.attachment.payload.elements.buttons
          // requirements(postback): type, title, payload
          buttons: [{
            type: "postback",
            title: "Read more",
            payload: "Nothing here, Please view in browser"
          },
          // requirements(url): type, title, url
          {
            type: "web_url",
            url: "",
            title: "View in browser"
          }]
        };
        // assign title
        myelement.title = pages[i].title;
        console.log("pages : "+ pages[i].title);
        // assign subtitle
        myelement.subtitle = pages[i].extract.substr(0, 80).trim();
        // assign url
        myelement.buttons[1].url = "https://en.wikipedia.org/?curid=" + pages[i].pageid;
        // assign payload
        if (pages[i].extract != "") {
        myelement.buttons[0].payload = pages[i].extract.substr(0, 1000).trim();
        }
        myTemplate.message.attachment.payload.elements.push(myelement);
      }
      options.body = myTemplate;
    }
    catch (err) {
      console.log("error : " + err.message);
      options = {
	    url: "https://graph.facebook.com/v2.6/me/messages",
	    qs: {access_token: FB_TOKEN},
        method: 'POST',
        json: {
          recipient: { id: userid},
          message: { text: "Something went wrong, please try again."}
        }
      };
    }
    // sent request to fb chatbot api
    request(options, function(error, response, body) {
      if (error) {
        console.log(error.message);
      }
      console.log("body");
      // return recipient_id and message_id
      console.log(body);
    });
  });
}

app.listen(app.get('port'), function() {
	console.log("running: port");
})