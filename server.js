// server.js
// Already set up for express

var express = require('express');
var app = express();

//mongo setup **dont forget to add dependency in package.json**
var mongodb = require('mongodb');
var MONGODB_URI = process.env.DBURL;

app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/con", function(request,response) {
  connect();
  response.send("connected"); 
});

app.get("/:numtag", function(request, response) {
  let num = request.params.numtag;
  if (!isNaN(num)) {
    num = parseInt(num);
    mongodb.MongoClient.connect(MONGODB_URI, function (err, db) {
      if (err) {
        response.send("error in num connect");
      }         
      
      db.collection("urlShortener").find({"short": num}).toArray(function(err, docs) {
        if (err) {
          db.close();
          response.send("Error in toArray()");
        } 
        if (docs != undefined) {
          let address = docs[0].url;
          console.log(docs);
          console.log(address);
          db.close();
          response.redirect(address);
        } else {
          db.close();
          response.send("Failed to find value");
        }
      });
      
    });    
  } else {
    response.send("Want a number not: " + num);
  }
});

app.get("/shorten/*", addUrl);

function addUrl(request, response) {
  
  //more on request.params and reg expression routes like *: https://expressjs.com/en/4x/api.html#req.params
  let inputUrl = request.params[0];
  
  let addObject = {};
  
  //if valid url
  if (testUrl(inputUrl)) {
    mongodb.MongoClient.connect(MONGODB_URI, function (err, db) {
      if (err) {
        db.close();
        
        response.send("error: ");
      }         
      
      let newUrl = request.protocol + '://' + request.get('host') + '/' + 52;
      //db.collection("testData").update(inputUrl, 52, {upsert:true});
      addObject = {originalUrl: inputUrl, newUrl: newUrl};
      db.close();
      response.send(addObject);
      
    });    
  } else {
    response.send("bad url: " + inputUrl);
  }
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
    
    var resultArr = [];
    console.log('Connection established to learningmongo database');
    
    // do some work here with the database.
    let collection = db.collection(process.env.COLLECTION).find();
    collection.forEach(function(doc, err) {
      if (err) throw err;
      resultArr.push(doc);
      console.log(doc);
    }, function() {
      //callback
      console.log(resultArr);
      console.log("running close");
      db.close();
    });
    
    //database stats if needed
    //var promiseObj = db.stats();
    
    //promiseObj.then(function(val) {
    //  console.log(val);
   // }); 

  });
                              
}