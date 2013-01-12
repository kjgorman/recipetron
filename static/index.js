$(document).ready(function() {
	

	function randomAnimation(){
		var anims = ['bounceInLeft', 'bounceInRight', 'bounceIn', 'fadeInLeftBig', 'fadeInRightBig', 'fadeInUpBig',
		             'fadeInDownBig', 'rotateInDownRight', 'rotateInDownLeft', 'rotateInUpRight', 'rotateInUpLeft',
		             'lightSpeedIn'];
		return anims[Math.floor(Math.random()*anims.length)];
	}

	function renderElement(element){
		$("<div class='line-item animated "+randomAnimation()+"''>"
		 +"<span class='item'>&times;"+element.item+"</span>"
		 +"<span class='price'>"+element.price+"</span>"
		 +"</div")
		.appendTo($(".main-container"));
	}

	function poll(){
		$.post('/poll', function(data){
			if(data.data){
				$("#spinner").hide();
				$(".line-item").remove();
				if(!data.data.length) renderElement({item:"Sorry, we got nothin'", price:""});
				for(var i = 0; i < data.data.length; i++){
					renderElement(data.data[i]);
				}
			}else{
				setTimeout(function(){ poll(); }, 1000);
			}
		});
	}

    $(".js-keypress").keyup(function(e){
    	/*submit query on <RET>*/
    	if(e.keyCode === 13)  {
    		$("#spinner").show();
    		$.post('/search', {'keyword': $(this).val()}, function(data){
    			if(data.status)
    				poll();
    		});
    	}
    });

})