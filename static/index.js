$(document).ready(function() {

		function appendLoggedInElems(username) {
        $(".login-form").append($("<span class='logged-in'>Hi, "+username+"</span>"));
				$(".login-form").append($("<button class='logged-in' id='logout-submit'>logout</button>"));
				$("#logout-submit").on('click', function() {
						User.currentUser.logout();
				});
		}

		$.post("/", function(data) {	
				if(data) {
						$(".logged-out").hide().val("");
						User.currentUser = new User(data);
						appendLoggedInElems(data);
				} 
		});

		function randomAnimation(){
				var anims = ['bounceInLeft', 'bounceInRight', 'bounceIn', 'fadeInLeftBig', 'fadeInRightBig', 'fadeInUpBig',
										 'fadeInDownBig', 'rotateInDownRight', 'rotateInDownLeft', 'rotateInUpRight', 'rotateInUpLeft',
										 'lightSpeedIn'];
				return anims[Math.floor(Math.random()*anims.length)];
		}

		function renderElement(element){
				$("<div class='line-item'>"
					+"<span class='item'>&times;"+element.item+"</span>"
					+"<span class='price'>"+element.price+"</span>"
					+"</div")
						.appendTo($(".content-preview"));
		}

		function renderSavingsAsPercentage(data){
				var numWithMatches = 0;
				data.map(function(a) { numWithMatches += a[Object.keys(a)[0]].length == 0 ? 0 : 1; });
				
				var percentage = (numWithMatches/(data.length-1))*100;
				//probably going to put raphael in here at some point to animate a cool progress bar thing
				$("<div class='header'>"
					+"<span>This recipe is </span><span class='"+percentage+"-percent'>"+(""+percentage).substr(0,4)+"%</span> on sale this week!</span>"
					+"</div>")
						.appendTo(".content-preview"); 
				$("."+percentage+"-percent").css("color",getColour(percentage));
		}

		function renderIngredientHeader(ingredient){
				$("<div class='ingredient'>"
					+"<span>"+ingredient+"</span>"
					+"</div>")
						.appendTo(".content-preview");	
		}

		function getColour(percent) {
				var hue = (percent/100) * 0.4
				,saturation = 0.7
				,brightness = 0.4;
				return Color.hsl(hue, saturation, brightness).hexTriplet();
		}

		function poll(){
				$.post('/poll', function(data){
						console.log(data);
						if(data.data){
								$(".content-preview").html("");
								$("#spinner").hide();
								$(".line-item").remove();
								renderSavingsAsPercentage(data.data);
								//if(!data.data.length) renderElement({item:"Sorry, we got nothin'", price:""});
								for(var i=0; i<data.data.length; i++ ){
										var ingredient = Object.keys(data.data[i])[0];
										if(data.data[i][ingredient].length > 0){
												renderIngredientHeader(ingredient);
												for(var j=0; j<data.data[i][ingredient].length; j++){
														renderElement(data.data[i][ingredient][j]);
												}
										}
								}
						}else{
								setTimeout(function(){ poll(); }, 1000);
						}
				});
		}
		
		$(".js-keypress").keyup(function(e){
				/*submit query on <RET>*/
				if(e.keyCode === 13 && $(this).val() !== "")  {
						$("#spinner").show();
						$.post('/search', {'keyword': $(this).val()}, function(data){
								if(data.status)
										poll();
						});
				}
		});

    function login() {
				var $uname, $pwd;
				if(($uname = $('.login-username').val()) !== "" && ($pwd = $('.login-password').val()) !== "") {
						var user = new User($uname);
						user.login($pwd, function(username){
								User.currentUser = user;
								$(".logged-out").hide().val("");
								appendLoggedInElems(username);
						});						
        }
		}


    $('.logged-out').on('keypress', function(e) { if(e.which == 13) { login(); } });
		$('#login-submit').on('click', login);

}); 