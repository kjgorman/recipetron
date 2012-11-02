$(document).ready(function() {
	
	$('body').noisy({
    'intensity' : 1, 
    'size' : 200, 
    'opacity' : 0.081, 
    'fallback' : 'fff9ad', 
    'monochrome' : false
    }).css('background-color', '#fff9ad'); 

	function renderElement(element){
		$("<div class='line-item'>"
		 +"<span class='item'>&times;"+element.item+"</span>"
		 +"<span class='price'>"+element.price+"</span>"
		 +"</div")
		.appendTo($(".main-container"));
	}

	function poll(){
		$.post('/poll', function(data){
			console.log(data);
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