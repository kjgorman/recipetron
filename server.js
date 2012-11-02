var express        = require('express')
   ,app            = express()
   ,scraper        = require('./scrape')
   ,cookieSessions = require('./cookie-sessions')
   ,Guid           = require('guid');



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
		scraper.scrape(req.body.keyword, function(data){
			pollData[req.session.sid] = data;
			res.send(200, {status: "all good yo"});
		});
	}catch(err){
		res.send(500, {error: err});
	}
});

app.listen(3000);
console.log('server listening on localhost:3000');