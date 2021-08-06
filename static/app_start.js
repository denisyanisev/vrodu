var startApp = function (user) {
    window.user = user;
    window.tree_id = user.id;
    setDiagramOptions();
    updateTree({
        tree_id: user.id,
        callback: function (data) {
            var res = data['persons'].filter((person) => user.id == person['vk_id'] && user.id == person['tree_id']);
            if (res.length == 0)
                addMainPerson()

                single_count = data['tree_list'][user.id] ? data['tree_list'][user.id] : 1
	        $('#tree_list').append(
                    $('<li href="#" style="color: rgb(47,22,22)"  id="tree' + user.id + '" onclick="TreeSwitch(' +
                            user.id + ')">Личное Дерево' + ' ('
                            + single_count  + ')' + '</li>')
                );
	        tree_list = data['tree_list']
            for (key in tree_list) {
                if (user.id != key)
                    $('#tree_list').append(
                        $('<li href="#" id="tree' + key + '" onclick="TreeSwitch(' + key + ')">Дерево '
                        + key + ' (' + tree_list[key] + ')' +'</li>')
                    );
            }
            $('#draggable').css({
                left:
                    (-parseInt($('#draggable').css('width')) +
                        parseInt($(window).width())) /
                    2,
                top: 30,
            });
            $('#draggable').show();
            user_tree_id = res[0]['id']
            centerOnPerson(user_tree_id);
            window.user_tree_id = user_tree_id
        },
    });
};

$(window).on('load', function () {
    try {
        VK.init(
            function () {
                getUser(startApp);
            },
            function () {
                console.log('error');
                var user = new Object();
                user.first_name = 'default';
                user.last_name = 'user';
                user.id = 0;
                startApp(user);
            },
            '5.75'
        );
    } catch (Exception) {
        console.log('error');
        console.log(Exception);
        var user = new Object();
        user.first_name = 'default';
        user.last_name = 'user';
        user.id = 0;
        startApp(user);
    }
});
