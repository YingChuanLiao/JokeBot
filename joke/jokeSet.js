const fs = require("fs");
let nerdJokes = JSON.parse(fs.readFileSync("./joke/nerd.txt","utf8"));
let mathJokes = JSON.parse(fs.readFileSync("./joke/math.txt","utf8"));
let dumbJokes = JSON.parse(fs.readFileSync("./joke/dumb.txt","utf8"));
let stupidJokes = JSON.parse(fs.readFileSync("./joke/stupid.txt","utf8"));
let dadJokes = JSON.parse(fs.readFileSync("./joke/dad.txt","utf8"));
let fatJokes = JSON.parse(fs.readFileSync("./joke/fat.txt","utf8"));
module.exports = {
    jokesInfo :{
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
    },

    otherJokesInfo : {    
        "dad":{
            url: "https://media.giphy.com/media/xT5LMqMxZPWpipTLCU/giphy.gif",
            subtitle:"You can always see different groups of people gathered in the schoolyard. We have the jocks, the goth, and so on. I dedicate these nerd jokes to all the nerds out there. Without them, we would not have the technology we have today, iPhones, cars, computer and so on. I myself was a bit of a nerd and hey I’m fine today.",
            jokes: dadJokes,
            amount: dadJokes.length
        },
        "stupid":{
            url: "https://memeguy.com/photos/thumbs/how-i-feel-every-time-i-get-a-few-upvotes-62108.jpg",
            subtitle:"Some jokes are funny, some are silly, but some are just plain stupid. They are so stupid that they actually become funny. We all have different humor; the one thing you may find funny another person don´t this is why I got different category of jokes.",
            jokes: stupidJokes,
            amount: stupidJokes.length
        },
        "fat":{
            url: "https://pbs.twimg.com/media/BSa9H0MCcAAsH6L.jpg:large",
            subtitle:"This joke category is all about the fat. Yes indeed the Fat jokes, they are funny and somewhat cruel. However, before we begin I must say that these jokes are not intended to hurt or be used as such to hurt anyone’s feelings.",
            jokes: fatJokes,
            amount: fatJokes.length
        }
    }
};