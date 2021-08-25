var parseVkID = function(id_string, dom_element, single){
    var vk_id
    vk_id = id_string.match(/(?:id)([0-9]+)/)
    if (vk_id){
        vk_id = vk_id[1]
        $(dom_element).val(vk_id);
        VK.api("users.get", {'user_ids': id_string, 'fields': 'city,domain,photo_50,photo_200_orig,sex', 'v': '5.131'}, function(data) {
            vk_resp = data.response[0];
            $('#vk_photo_temporary').val(vk_resp.photo_200_orig);
            if (single) {
                $('#first_name').val(vk_resp.first_name);
                $('#last_name').val(vk_resp.last_name);
                $('input[name=sex]').val(vk_resp.sex == 2 ? 'M' : 'F');
                if (vk_resp.sex == 2)
                    $('#male').prop('checked', true)
                else
                    $('#female').prop('checked', true)
                $('#vk_photo_single').val(vk_resp.photo_200_orig);
            }
		 })
    }
    else
        VK.api("users.get", {'user_ids': id_string, 'fields': 'city,domain,photo_50,photo_200_orig,sex', 'v': '5.131'}, function(data) {
        if (data.error) {
            alias = id_string.match(/(?:vk.com\/)([^\>]*)/)[1]
            VK.api("users.get", {'user_ids': alias, 'fields': 'city,domain,photo_50,photo_200_orig,sex', 'v': '5.131'}, function(data) {
                vk_id = data.response[0];
                $(dom_element).val(vk_id.id);
                $('#vk_photo_temporary').val(vk_id.photo_200_orig);
    		    if (single) {
                    $('#first_name').val(vk_id.first_name);
                    $('#last_name').val(vk_id.last_name);
                    $('input[name=sex]').val(vk_id.sex == 2 ? 'M' : 'F');
                    if (vk_id.sex == 2)
                        $('#male').prop('checked', true)
                    else
                        $('#female').prop('checked', true)
                    $('#vk_photo_single').val(vk_id.photo_200_orig);
       		    }
		 })
	    }
	    else {
	        vk_id = data.response[0];
		    $(dom_element).val(vk_id.id);
		    $('#vk_photo_temporary').val(vk_id.photo_200_orig);
	    }
        if (single) {
            $('#first_name').val(vk_id.first_name);
            $('#last_name').val(vk_id.last_name);
            $('input[name=sex]').val(vk_id.sex == 2 ? 'M' : 'F');
	    if (vk_id.sex == 2)
	        $('#male').prop('checked', true)
	    else 
		$('#female').prop('checked', true) 			
            $('#vk_photo_single').val(vk_id.photo_200_orig);
        }
    });
}

var getUser = function(callback){
		VK.api("users.get", {'fields': 'photo_50', 'v': '5.131'}, function(data) {
			callback(data.response[0]);
			})
	}

var addMainPerson = function(){
	VK.api("users.get", {'fields': 'city,domain,photo_50,photo_200_orig,sex', 'v': '5.131'}, function(data) {
		main_person = data.response[0]
		add_vk_person(main_person.id, main_person.first_name, main_person.last_name, main_person.sex, main_person.photo_200_orig, 'new_person', 'confirmed')
	});
}

var sendRequest = function(){
		VK.callMethod("showRequestBox", 549396892, "Hello!", "myRequestKey");
	}

var getFriends = function(q, dom_result){
	VK.api("users.get", {'fields': 'photo_50', 'v': '5.131'}, function(data) {
		if (data.response){
			VK.api('friends.search', {'user_id': data.response[0].id, 'q': q, 'count': '10', 'v': '5.131', 'fields': 'city,domain,photo_50,photo_200_orig,sex'},
        	function(data){
        	    $('#full_search_results').html('');
		        $('#full_search_results_single').html('');
        	    var items = data.response.items
        	    items.forEach((element) => {
        	   		var add_vk = `add_vk_person(${element.id},'${element.first_name}','${element.last_name}','${element.sex}','${element.photo_200_orig}')`;
                    var result_item = `<div class="result_item" id=${element.id} onclick="${add_vk}; alert('Персона добавлена!'); VK.callMethod('showRequestBox', ${element.id}, 'Вас добавили в Родословное дерево. Присоединяйтесь!');">` + '<img src=' + element.photo_50 + '>' + element.first_name + ' ' + element.last_name + '</div><div style="clear:both"></div>';
                    $(dom_result).append(result_item);
                });
        	});
		}
	});
	VK.api('friends.get', {'user_id': '549396892', 'count': '3', 'v': '5.131', 'fields': 'city,domain'},
	    function(data){});
}

var getAppFriends = function(){
	VK.api('friends.getAppUsers', {'v': '5.131'}, function(data){
		console.log(data);
		});
	}


