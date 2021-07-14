var startApp = function(user){
    window.user = user
    window.tree_id = user.id
    setDiagramOptions();
    updateTree({tree_id: user.id, callback: function(data){
        var res = data['persons'].filter(person => (user.id == person['vk_id'] && user.id == person['tree_id']))
            if (res.length == 0)
                addMainPerson()
            $('#tree_list').append($('<li href="#" onclick="TreeSwitch(' + user.id  +  ')">Мое Дерево</li>'));
            data['tree_list'].forEach(function(elem) {
                if (user.id != elem)
                    $('#tree_list').append($('<li href="#" onclick="TreeSwitch(' + elem + ')">Дерево ' + elem + '</li>'));
            });
            $('#draggable').css({left: (-parseInt($('#draggable').css('width'))+parseInt($(window).width()))/2, top: 30});
            $('#draggable').show();
    }});
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
