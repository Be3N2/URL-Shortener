// server.js
// Already set up for express

var express = require('express');
var app = express();

//mongo setup **dont forget to add dependency in package.json**
var mongodb = require('mongodb');
var MONGODB_URI = process.env.DBURL;

var collection;
var startup = true;

app.use(express.static('public'));

app.get("/", function (request, response) {
  if (startup) connect();
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/:numtag", function(request, response) {
  if (startup) connect();
  let num = request.params.numtag;
  if (testHex(num)) {   
    
    collection.find({"short": num}).toArray(function(err, docs) {
      if (err) throw err;
      
      //wont throw err if it doesn't find it, need to check the array
      if (docs.length != 0) { 
        let address = docs[0].url;
        if (!/^(f|ht)tps?:\/\//i.test(address)) {
          address = "http://" + address;
        }
        response.redirect(address);
      } else {
        response.send("Failed to find value");
      }
    });
      
        
  } else {
    response.send("Want a number not: " + num);
  }
});

app.get("/shorten/*", addUrl);

function addUrl(request, response) {
  if (startup) connect();
  
  //more on request.params and reg expression routes like *: https://expressjs.com/en/4x/api.html#req.params
  let inputUrl = request.params[0];
  
  let displayObj = {originalUrl: inputUrl, newUrl: null};
  
  //if valid url
  if (testUrl(inputUrl)) {
      
    collection.find({"url": inputUrl}).toArray(function(err, docs) {
      if (err) throw err;

      if (docs.length != 0) {
        
      } else {
        //doesn't exist need to create it
        
        //nice code snippet generates random 3 digit hex value from https://www.paulirish.com/2009/random-hex-color-code-snippets/
        let randomHex = Math.floor(Math.random()*4095).toString(16);
        let serverObject = {url: inputUrl, short: randomHex};
        
        let newUrl = request.protocol + "://" + request.get('host') + '/' + randomHex;
        displayObj.newUrl = newUrl;
        
        try {
          collection.insertOne(serverObject);
          response.send(displayObj);
        } catch (err) {
          response.send("error");
          throw err;
        }
      }
      
    });
       
  } else {
    response.send("bad url: " + inputUrl);
  }
}

function testHex(incoming) {
  var regX = /[0-9A-Fa-f]/g; //regular expression for 0-e number range
  return regX.test(incoming);
}

function testUrl(inputUrl) {
  
  //regex from stack overflow https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?'+ // port
  '(\\/[-a-z\\d%_.~+&:]*)*'+ // path
  '(\\?[;&a-z\\d%_.,~+&:=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  
  return pattern.test(inputUrl);
}

// open port with a callback
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

//mongo stuff
function connect() {
  
  mongodb.MongoClient.connect(MONGODB_URI, function(err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
      return;
    }
    
    console.log('Connection established to learningmongo database');
    
    // do some work here with the database.
    collection = db.collection(process.env.COLLECTION);
    collection.find().forEach(function(doc, err) {
      if (err) throw err;
      console.log(doc);
    }, function() {
      //callback
      console.log("running close");
      startup = false;
    });
    
    //database stats if needed
    //var promiseObj = db.stats();
    
    //promiseObj.then(function(val) {
    //  console.log(val);
    //}); 

  });
                              
}