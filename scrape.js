var request = require('request');

exports = module.exports = setup();
exports.version = "0.0.1";

function setup(){
	var that = this;
	var keywordCapture;
	this.totalPages = -1;
	this.data = {};
	
	this.scrape= function(keyword, callback){	
		keywordCapture = new RegExp(keyword, 'i');
		getTotalNumberOfPages(function(){
			for(var i = 0; i < that.totalPages; i++){
				scrapePage(i, callback);
			}
		});
	};

	this.scrapePage = function(pageNumber, callback){
		var pageReq = fillRequestDetails();
    	pageReq['uri'] = "http://www.newworld.co.nz/savings/?page="+pageNumber
    	   
		
		request(pageReq, function(error, response, body){
			if(!error & response.statusCode === 200){
				var savingsCapture = /<h4>([^<]+)<\/h4>\s*<p\s*class=\"price\">([^<]+)<span>(\d+)/g
				var match;
				that.data[pageNumber] = [];
				while( (match = savingsCapture.exec(body)) != null){
					if(keywordCapture.exec(match[1]))
						that.data[pageNumber].push({item: match[1], price: match[2]+"."+match[3]});
				}
			}
			checkCompletion(callback);
		});
	}

    this.checkCompletion = function(callback){
    	if(that.totalPages && that.data[this.totalPages-1]){
			callback(that.data);
			that.data = {};
    	}
    }

    this.getTotalNumberOfPages = function(callback){
    	var req = fillRequestDetails();
     	req['uri'] = "http://www.newworld.co.nz/savings/"
    	   
    	request(req, function(error, response, body){
    		if(!error & response.statusCode === 200){
    			var pageCapture = /title="Last page" class="arrow" href="\/savings\/\?page=(\d+)/;
    			var match = pageCapture.exec(body);
    			that.totalPages = match[1];
    			callback();
    		}else{
    			throw error;
    		}
    	});
    };
 
    this.fillRequestDetails = function(){
    	var pageReq = {
		   headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.101 Safari/537.11'}
		};

		var cookieJar = request.jar();
		cookieJar.add(request.cookie('new-world-store-id=storenodeid=1260'));
		cookieJar.add(request.cookie('new-world-shopping=[{"Id":999,"Text":"My Shopping List","IsActive":true,"Items":[]}]'));
		cookieJar.add(request.cookie('new-world-favs=[]'));
		cookieJar.add(request.cookie('__utma=264539792.1566992007.1356917641.1356917641.1356917641.1'));
		cookieJar.add(request.cookie('__utmc=264539792'));
		cookieJar.add(request.cookie('__utmz=264539792.1356917641.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none);'));
		cookieJar.add(request.cookie('__atuvc=15%7C1'));
		pageReq['jar'] = cookieJar;
		pageReq['referer'] = 'http://www.newworld.co.nz/lower-north-island/wellington/thorndon/';
		pageReq['Connection'] = 'keep-alive';

		return pageReq;
    }

	return {
		scrape : this.scrape
	}
};
