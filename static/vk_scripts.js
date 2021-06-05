var getUser = function(callback){
		VK.api("users.get", {'fields': 'photo_50'}, function(data) {
			callback(data.response[0]);
			})
	}

var sendRequest = function(){
		VK.callMethod("showRequestBox", 549396892, "Hello!", "myRequestKey");
	}

var getFriends = function(q){
	VK.api("users.get", {'fields': 'photo_50'}, function(data) {
        VK.api('friends.search', {'user_id': data.response[0].id, 'q': q, 'count': '10', 'v': '5.130', 'fields': 'city,domain,photo_50,photo_200_orig,sex'},
        function(data){
            $('#full_search_results').html('');
            var items = data.response.items
            items.forEach((element) => {
                var result_item = `<div class="result_item" id=${element.id}><input name="q_id" type="text" val="${element.id}">
                <input name="q_first_name" type="text" val="${element.first_name}"><input name="q_last_name" type="text" val="${element.last_name}">
                <input name="q_sex" type="text" val="${element.sex}"><input name="q_photo" type="text" val="${element.photo_200_orig}">`
                 + '<img src=' + element.photo_50 + '>' + element.first_name + ' ' + element.last_name + '</div><div style="clear:both"></div>';
                $('#full_search_results').append(result_item);
            });
        });
	});
	VK.api('friends.get', {'user_id': '549396892', 'count': '3', 'v': '5.130', 'fields': 'city,domain'},
	    function(data){});
}

var getAppFriends = function(){
	VK.api('friends.getAppUsers', function(data){
		console.log(data);
		});
	}


