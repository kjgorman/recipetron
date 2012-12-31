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
		flattened = flattened.concat(data[i]);
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
						pollData[req.session.sid] = data;
						res.send(200, {status: "all good yo"});
					});
				}else{
					redisClient.get("data", function(err, reply){
						var data = JSON.parse(reply);
						var searchedData = {};
						var re = new RegExp(req.body.keyword, "i");
						for(var page in data){
							searchedData[page] = [];
							for(var itemIdx = 0; itemIdx < data[page].length; itemIdx++){
								if(re.test(data[page][itemIdx].item)) searchedData[page].push(data[page][itemIdx]);
							}
						}
						pollData[req.session.sid] = searchedData;
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

app.listen(3000);
console.log('server listening on localhost:3000');