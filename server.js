var express        = require('express')
   ,app            = express()
   ,scraper        = require('./scrape')
   ,cookieSessions = require('./cookie-sessions')
   ,Guid           = require('guid')
   ,redisClient    = require('redis').createClient();



//static routes
app.use('/static', express.static(__dirname+"/static"));
app.use('/static/lib', express.static(__dirname+"/static/lib"));
app.use('/fonts', express.static(__dirname+"/fonts"));
//middleware
app.use(express.bodyParser());
app.use(express.cookieParser("vangelis"));
app.use(cookieSessions("sid"));

//hash from session ids to query data.
var pollData = {}; 

//Flattens a dictionary of lists into a single list, 
//then invokes the continuation on the flattened list.
function flatten(data, continuation){
	var flattened = [];
	for(var i in data){
      var obj = {}; obj[i] = data[i]
			flattened = flattened.concat(obj);
	}
	continuation(flattened);
}

//main page; sets session identifier if none present.
app.get('/', function(req, res){
	req.session.sid = req.session.sid || Guid.create(); 
	res.sendfile('index.html');
});

app.post('/poll', function(req, res){
    if(req.session.sid && pollData[req.session.sid]){
		    flatten(pollData[req.session.sid], function(data){
				  res.send(200, {data:data, status:'complete'});
				  pollData[req.session.sid] = undefined;
				});
    }else{
    	res.send(200, {status: 'continue'});
    }
});

app.post('/search', function(req, res){
	req.session.sid = req.session.sid || Guid.create();
	try{
		redisClient.get("lastUpdated", function(err, reply){
			if(reply == null){
				redisClient.set("lastUpdated", (new Date()).toUTCString());
			}else{
				var lastUpdateDate = new Date(reply)
				   ,current = new Date();
				if(current - lastUpdateDate > (7*24*60*60*1000)) {
					scraper.scrape(req.body.keyword, function(data){
						redisClient.set("data", JSON.stringify(data));
						redisClient.set("lastUpdated", new Date().toUTCString());
						pollData[req.session.sid] = filterData(req.body.keyword, data);
						res.send(200, {status: "all good yo"});
					});
				}else{
					redisClient.get("data", function(err, reply){
						var data = JSON.parse(reply);
						pollData[req.session.sid] = filterData(req.body.keyword, data)
						res.send(200, {status: "all good yo"});
					});
				}
			}
		})		
	}catch(err){
		console.error('failed with:', err)
		res.send(500, {error: err});
	}
});

function filterData(keywords, data) {

	if(keywords === undefined || data === undefined) return {};
  if(typeof keywords !== "string") return {};
  var searchedData = {};
  //split the keywords out, kill whitespace, and then order by length
  //so when we compile the regex of terms the alternation will be 
	// POSIX style greedy. bit inefficient mapping repeatedly, but 
	//I prefer the functional style so whatever... premature opts are
	//evil anyway right.
  var keys = keywords.split(",")
			.map(function (a) { return a.trim(); })
      .filter(function(a) { return a !== ""; })
      .sort(function (a, b) { return a.length < b.length; })
			.map(function(a) { return a.toLowerCase(); })
			.map(function(a) { searchedData[a] = []; return a; }) /*initialise return fields*/
			,keysRex = "("+keys.join("|")+")";

  searchedData["ingredients"] = [] //ensure we always have a place to push
  console.log("search rex:", keysRex);
  var re = new RegExp(keysRex, "i");
  for(var page in data){
      for(var itemIdx = 0; itemIdx < data[page].length; itemIdx++){
					var item = data[page][itemIdx], maybeMatch;
					if(maybeMatch = re.exec(item.item)) {
              var matchedItem = maybeMatch[0].toLowerCase();
							(searchedData[matchedItem] || searchedData["ingredients"]).push(data[page][itemIdx]);
					}
      }
  }				
  return searchedData;		
}

app.listen(3000);
console.log('server listening on localhost:3000');