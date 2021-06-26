var startApp = function(user){
    window.user = user
    $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/update',
        data: JSON.stringify({user_id: user.id}),
        dataType: 'json',
        success: function(data) {
             data['tree_list'].forEach(function(elem) {
	        console.log(elem['tree_owner']);	
		$('#tree_list').append($('<div href="#" onclick="TreeSwitch('+elem['tree_owner']+')">'+elem['tree_owner']+'</div>'));
		});
            setDiagramOptions();
            setDiagramData(data['persons'])
        }
    });
}

$(window).on("load", function(){
    try {
        VK.init(function(){
            getUser(startApp);
        }, function(){
            console.log("error");
            var user = new Object();
            user.first_name = 'default';
            user.last_name = 'user';
            user.id = 0;
            startApp(user);
        }, '5.75');
    }
    catch (Exception){
        console.log("error");
        console.log(Exception);
        var user = new Object();
        user.first_name = 'default';
        user.last_name = 'user';
        user.id = 0;
        startApp(user);
    }
});
