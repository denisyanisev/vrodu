var getId = function(){
		VK.api("users.get", {'fields': 'photo_50'}, function(data) {
			console.log(data.response);
			//user_fam = data.response[0].last_name;
			//user_name = data.response[0].first_name;
			person_id = data.response[0].id;
			$('.person_id').each(function(i,elem){
				if ($(this).val() == person_id) {
					$(this).parent().css('background', '#c8e4f8');
				}
			})
		});

	}

var SentNotification = function(){
	VK.api('utils.getServerTime', function(data){
		var timestamp = data.response

		//console.log(timestamp);
		//https://oauth.vk.com/access_token?client_id=7851891&client_secret=g85lXmVscKkmsQyTpQ0b&v=5.130&scope=friends,notify,photos,wall,email,mail,groups,stats,offline&grant_type=client_credentials
		//{"access_token":"49489d1c49489d1c491a4d6d95493f526f4494849489d1c29d30ee21a141b8205a0aab9","expires_in":0}
		//$sig = md5("api_id=".$api_id."message=".$message."method=".$method."random=".$random."timestamp=".$timestamp."uids=".$uids."v=".$version.$secret);
		$.ajax('/notification.php', {
			  success: function(data) {
				console.log(data);
			  },
			  error: function() {
				console.log(data);
			  }
		   });
		//VK.api('secure.sendNotification', {'message': 'test', 'user_ids': '549396892', 'user_id': '549396892', 'client_secret': '04pwqdfY5IfTbBrbhe9a', 'access_token': '913991d46f652f1d85aaf2451ea1967355f179a9462c1481faab0197c4c083a629babe27e7be397db2c0c', 'timestamp': timestamp, function(data){
		console.log(data);
		});
		};

var SendRequest = function(){
		VK.callMethod("showRequestBox", 549396892, "Hello!", "myRequestKey");
	}

var GetFriends = function(){
	VK.api('friends.get', {'user_id': '549396892', 'count': '3', 'offset': '5', 'v': '5.130', 'fields': 'city,domain'}, function(data){
		console.log(data);
		});
	}

var GetAppFriends = function(){
	VK.api('friends.getAppUsers', function(data){
		console.log(data);
		});
	}

VK.init(function(){

    status = true;
    console.log("vk init");
    var id = getId();
	console.log(id);
	}, function(){
		console.log("error");
	}, '5.75');