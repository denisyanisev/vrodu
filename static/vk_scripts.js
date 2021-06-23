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
        	    console.log(data);
        	    $('#full_search_results').html('');
        	    var items = data.response.items
        	    items.forEach((element) => {
        	    var add_vk = `add_vk_person(${element.id},'${element.first_name}','${element.last_name}','${element.sex}','${element.photo_200_orig}')`;
                    var result_item = `<div class="result_item" id=${element.id} onclick="${add_vk}; alert('Персона добавлена!'); VK.callMethod('showRequestBox', ${element.id}, 'You have been invited to Family tree! Please join');">` + '<img src=' + element.photo_50 + '>' + element.first_name + ' ' + element.last_name + '</div><div style="clear:both"></div>';
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


