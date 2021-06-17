$(function() {$( "#draggable" ).draggable();});

function add_vk_person(vk_id, first_name, last_name, vk_sex, photo){
        var Request = {
        from_id: (parseInt($("#person_id").val())),
        first_name: first_name,
        middle_name: '',
        last_name: last_name,
        description: '',
        birth: '',
        is_alive: true,
        death: '',
        sex: (vk_sex == 2) ? 'M' : 'F',
        location: '',
        relative_type: $("input[name=relative_type]:checked").val(),
        vk_id: vk_id,
        photo: photo,
        user_id: window.user.id
        };
        add_person_base(Request);
    }

function add_person_base(Request){
    $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/add',
        data: JSON.stringify(Request),
        dataType: 'json',
        success: function(data) {
            $('#full_info_block').hide();
            if (data['persons'] == -1){
                $('#failed_message').text(data['Error']);
                $("#dialog-message").dialog();
                return;
            }
            var cache = data;
            var options = window.diagramSettings;
            if (Request.from_id != null && Request.relative_type == 'parent') {
                $.ajax({
                    'type': 'POST',
                    url: '/change',
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify({
                        from_id: Request.from_id,
                        new_id: data['new_id'],
                        sex: Request.sex,
                        user_id: window.user.id
                    }),
                    success: function(data) {
                       if (data['persons'] != -1){
                            options.items = data['persons'];
                            $("#diagram").famDiagram(options);
                            $("#diagram").famDiagram("update");
                            draw_belts();
                       }
                       else {
                            options.items = cache['persons'];
                            $("#diagram").famDiagram(options);
                            $("#diagram").famDiagram("update");
                            draw_belts();
                       }
                    }
                });
            }
            else {
            options.items = cache['persons'];
                $("#diagram").famDiagram(options);
                $("#diagram").famDiagram("update");
                draw_belts();
            }
        }
    });
}

function change_person(Request){
    $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/change',
        data: JSON.stringify(Request),
        dataType: 'json',
        success: function(data) {
            if (data['persons'] != -1){
                var options = window.diagramSettings;
                options.items = data['persons'];
                $("#diagram").famDiagram(options);
                $("#diagram").famDiagram("update");
                draw_belts();
            }
            else {
                $('#failed_message').text(data['Error']);
                $("#dialog-message").dialog();
                console.log(data);
            }
        }
    });
}

function open_input_block(){
$('#input_block').dialog({
    modal: true,
    width: 300,
    closeOnEscape: true,
    close: function(){
        $('#new_person_label').hide();
        flushFields();
    },
    buttons: [{
        text: "Добавить",
        click: function(){
        var Request = {
            first_name: $("#first_name").val(),
            middle_name: $("#middle_name").val(),
            last_name: $("#last_name").val(),
            description: $("#description").val(),
            birth: $("#birth").val(),
            is_alive: $("#is_alive").prop('checked'),
            death: $("#death").val(),
            sex: $("input[name=sex]:checked").val(),
            location: $("#location").val(),
            coordinate0: '',
            coordinate1: '',
            relative_type: $("input[name=relative_type]:checked").val(),
            from_id: (parseInt($("#person_id").val())),
            vk_id: (parseInt($("#vk_id").val())),
            user_id: window.user.id
            };
        if (Request.first_name == ''){
            $(this).dialog("close");
            $('#failed_message').text('Не указано имя!');
            $("#dialog-message").dialog();
            return;
        }
        $(this).dialog("close");
        if (Request.location != '') {
            var myGeocoder = ymaps.geocode(Request.location);
            myGeocoder.then(function(data){
                var coordinates = data.geoObjects.get(0).geometry.getCoordinates();
                Request.coordinate0 = coordinates[0];
                Request.coordinate1 = coordinates[1];
                add_person_base(Request);
                return;
            });
       }
        else {
            add_person_base(Request);
            return;
        }
    },
        id: "add_person"
  }]
  });

}

function edit_person_js(a) {
}

function add_person_js(a, b) {
    show_full_info(a);
    $('#full_info_block').tabs( "option", "active", 1 );
    b.stopPropagation();
}

function add_link_js(a){
    closeEdit();
    if ( window.link == 'listening' ){
        closeLink();
        var person_id = (parseInt($("#person_id").val()));
        var type_of_link = window.type_of_link;
        var link_id = (parseInt($(a).find("[name=person_id]").val()));
        var relative_type = $("input[name=relative_type]:checked").val();
        if (link_id == person_id) {
            $('#failed_message').text('Привязка той же персоны!');
            $( "#dialog-message" ).dialog();
        }
        else {
            flushFields();
            $.ajax({
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                url: '/link',
                data: JSON.stringify({
                    person_id: person_id,
                    link_id: link_id,
                    relative_type: relative_type,
                    user_id: window.user.id,
                    type_of_link: type_of_link
                }),
                dataType: 'json',
                success: function(data) {
                    if (data['persons'] != -1){
                        var options = window.diagramSettings;
                        options.items = data['persons'];
                        $("#diagram").famDiagram(options);
                        $("#diagram").famDiagram("update");
                        draw_belts();
                    }
                    else {
                        $('#failed_message').text(data['Error']);
                        $( "#dialog-message" ).dialog();
                    }
                }
            });
        }
    }
    // Show full info and edit person
    show_full_info(a);
}

function show_full_info(a) {
    var person_id = (parseInt($(a).find('[name=person_id]').val()));
    $('#full_id').val(person_id);
    $("#person_id").val(person_id);
    var photo = $(a).find('[name=photo]').attr('src');
    $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/pull',
        data: JSON.stringify({person_id: person_id}),
        dataType: 'json',
        success: function(data) {
            var result = data['result'][0];
            $('#full_photo').attr('src', photo);
            $('#full_birth_edit').val(result['birth']);
            $('#full_death_edit').val(result['death']);
            if (result['alive'] == false) {
                $('#full_death_edit').show();
                $('#full_is_alive_edit').prop('checked', false);
                $('#full_death_belt').show();
                var years = '...';
                if (result['birth'])
                    years = result['birth'];
                if (result['death'])
                    years += ' - ' + result['death'];
                else
                    years += ' - ...'
                $('#full_birth_death').val(years);
                }
            else {
                $('#full_death_edit').hide();
                $('#full_is_alive_edit').prop('checked', true);
                var years = result['birth'];
                $('#full_birth_death').val(years);
                $('#full_death_belt').hide();
            }
            if (result['sex'] == 'F')
                $('#full_info_block').css({'background': '#ffb1c7'});
            else
                $('#full_info_block').css({'background': '#88aae9'});
            $('#full_name').val(result['first_name']);
            $('#full_middle_name').val(result['middle_name']);
            $('#full_last_name').val(result['last_name']);
            $('#full_description').val(result['description']);
            if (result['location'])
            {
                $('#full_location').val(result['location']);
            }
            else
            {
                $('#full_location').val('');
            }
        }
    });
    $('#full_search_results').hide();
    $('#vk_id').val('');
    $('#full_info_block').show();
    $( '#full_info_block').tabs( "option", "active", 0 );
    $('#full_close').click(function(){
        closeEdit();
        $('#full_info_block').hide();
    });
}

function remove_person_js(person_id, title){
    $('#deleted_item').text(title);
    $( function() {
        $( "#dialog-confirm" ).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "Удалить": function() {
                    $.ajax({
                        type: 'POST',
                        contentType: 'application/json; charset=utf-8',
                        url: '/remove',
                        data: JSON.stringify({
                            person_id: person_id,
                            user_id: window.user.id
                        }),
                        dataType: 'json',
                        success: function(data) {
                            if (data['persons'] != -1){
                                var options = window.diagramSettings;
                                options.items = data['persons'];
                                $("#diagram").famDiagram(options);
                                $("#diagram").famDiagram("update");
                                draw_belts();
                            }
                        }
                    });
                    $( this ).dialog( "close" );
                    $('#full_info_block').hide();
                },
                Cancel: function() {
                  $( this ).dialog( "close" );
                }
            }
        });
    });
}

var setDiagramOptions = function(){
    var options = new primitives.orgdiagram.Config();
    options.cursorItem = null;
    options.hasSelectorCheckbox = primitives.common.Enabled.False;
    options.hasButtons = primitives.common.Enabled.False;
    options.pageFitMode = primitives.common.PageFitMode.PrintPreview;
    options.elbowType = primitives.common.ElbowType.Round;
    options.normalLevelShift = 20;
    options.dotLevelShift = 20;
    options.lineLevelShift = 24;
    options.normalItemsInterval = 10;
    options.dotItemsInterval = 1;
    options.lineItemsInterval = 1;
    options.linesWidth = 1;
    options.linesColor = "#7C8993";
    $("#diagram").famDiagram(options);
    var placeholder = $(".placeholder");
    $("#diagram").css({
        width: placeholder.width(),
        height: placeholder.height(),
    });

    window.diagramSettings = options;
}

ymaps.ready(init);
function init() {
    var suggestView1 = new ymaps.SuggestView('location', {results: 4});
    var suggestView2 = new ymaps.SuggestView('full_location', {results: 4});
    }
