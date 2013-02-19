$(document).ready(function() {

		function appendLoggedInElems(username) {
        $(".login-form").append($("<span class='logged-in'>Hi, "+username+"</span>"));
				$(".login-form").append($("<button class='logged-in' id='logout-submit'>logout</button>"));
				$("#logout-submit").on('click', function() {
						User.currentUser.logout();
				});
		}

		$.post("/", function(data) {	
				if(data.uname) {
						$(".logged-out").hide().val("");
						User.currentUser = new User(data.uname);
						appendLoggedInElems(data.uname);
            renderRecipes(data.data);
				} 
		});

    Raphael.fn.partArc = function (x, y, r, value, maxValue) {

        var set = this.set()
          , pi = Math.PI
          , cos = Math.cos
          , sin = Math.sin
          , t = (pi/2) * 3
          , rad = (pi*2 * (maxValue-value)) / maxValue + t
          , colors = ["#429A56", "#92171B", "#FFF"];

        set.push(this.circle(x, y, r).attr({ fill : colors[+!value], stroke : 0 }));

        var p = [
            "M", x, y,
            "l", r * cos(t), r * sin(t),
            "A", r, r, 0, +(rad > pi + t), 1, x + r * cos(rad), y + r * sin(rad), 
            "z"
        ];

        set.push(this.path(p).attr({ fill : colors[1], stroke : 0 }));


        set.push(this.circle(x, y, r*0.7).attr({ fill : colors[2], stroke : 0 }));

        return set;
    };

    function renderRecipes(recipes) {
        recipes.sort(function(a, b) {
            return a.pcnt < b.pcnt;
        });

        var $recipes = $(".js-recipe-container");
        $recipes.append($("<div class='content-header'>Your saved recipes</div>"));

        recipes.map(function(recipe) {
            var $recipe = $("<div class='content-body' style='font-size:1em;'><span class='price'>&raquo;</span></div>")
            , numOnSale = 0;

            recipe.recipe.map(function(i) {  
                var sale = i.sale, ingredient = i.ingredient;
                if(sale) numOnSale += 1;
                $recipe.append($("<span style='color:#"+(sale?'429A56':'92171B')+"'>"+ingredient+" </span>"));
            });

            $recipes.append($recipe);
            var circ = 35;
            var paper = Raphael($recipe.offset().left - 40, $recipe.offset().top - (circ/4), circ, circ);
            paper.partArc(circ/2,circ/2,circ/2,numOnSale,recipe.recipe.length);
            var deleteButton = $("<span style='float:right; cursor:pointer; color:#92171B'title='delete'>&times</span>");
            deleteButton.click(function() {
                //this is legit the most retarded way to this but whatever, if i wanted to write it
                //in a more oo way i'll redo the whole thing with ember or something
                var ingredients = [];
                $recipe.find("span").each(function(idx, el){ ingredients.push(el.innerHTML); });
                ingredients = ingredients.slice(1, ingredients.length-1).map(function(e) { return e.trim(); });
                
                $.ajax({url:'/delete', data:{data:ingredients}, type:'POST'})
                    .success(function() { $recipe.remove(); paper.remove(); })
                    .error(function() { console.log('err: yo'); });
            });
            $recipe.append(deleteButton);
        });
    }

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
                Popup.group('login-warnings', function(){ this.destroy() });
						}, function(err) {
                Popup.group('login-warnings').push(Popup.atElement($('#login-submit'), "Login failed"));
            });						
        }
		}

    function saveRecipe() {
        var $in = $("input.text-in");
        if(!!!!!$in.val()) { //don't bother if the input is not not not not not empty...
            Popup.group('search-warnings').push(Popup.atElement(this, "You can't save an empty search"));
            return;
        } else {
            Popup.group('search-warnings', function() { this.destroy() });
        }

        if(User.currentUser === undefined) {
            Popup.group('login-warnings').push(Popup.atElement(this, "Please login to save a search"));
        }
        
        var recipe = {ingredients: $("input.text-in").val().split(',')}

        $.post('/save', recipe, function(response) {
            console.log(response);
        });
    }


    $('.logged-out').on('keypress', function(e) { if(e.which == 13) { login(); } });
		$('#login-submit').on('click', login);
    $('#save-current').on('click', saveRecipe);


}); 