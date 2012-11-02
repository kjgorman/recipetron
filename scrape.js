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
		var pageReq = {
    		uri:"http://www.newworld.co.nz/savings/?page="+pageNumber
    	   ,headers:{"Cookie":"new-world-store-id=storenodeid=1260"}
    	};
		
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
    	var req = {
    		uri:"http://www.newworld.co.nz/savings/"
    	   ,headers:{"Cookie":"new-world-store-id=storenodeid=1260"}
    	};
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
 
	return {
		scrape : this.scrape
	}
};
