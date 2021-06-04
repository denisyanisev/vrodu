$(function() {$( "#draggable" ).draggable(); });

function add_vk_person(vk_id, first_name, last_name, vk_sex, photo){
        var id = $("#person_id").val();
        var first_name = first_name;
        var middle_name = '';
        var last_name = last_name;
        var description = '';
        var birth = '';
        var is_alive = true;
        var death = '';
        if (vk_sex == 2)
            sex = 'M';
        else
            sex = 'W';
        var location = '';
        var relative_type = $("input[name=relative_type]:checked").val();
        var vk_id = vk_id;
        $.get('/add', {
            first_name: first_name,
            middle_name: middle_name,
            last_name: last_name,
            description: description,
            birth: birth,
            is_alive: is_alive,
            death: death,
            sex: sex,
            location: location,
            relative_type: relative_type,
            from_id: id,
            vk_id: vk_id,
            user_id: window.user.id
        },  function(data) {
                alert('Персона добавлена из ВК');
                $('#full_info_block').hide();
                flushFields();
                if (data['persons'] == -1){
                    $('#failed_message').text(data['Error']);
                    $("#dialog-message").dialog();
                    return '';
                }
                var cache = data
                var options = window.diagramSettings;
                if (id && relative_type == 'parent') {
                    $.get('/change', {
                        id: id,
                        new_id: data['new_id'],
                        sex: sex,
                        user_id: window.user.id
                    }, function(data) {
                       flushFields();
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
                 });
                }
                else {
                options.items = cache['persons'];
                    $("#diagram").famDiagram(options);
                    $("#diagram").famDiagram("update");
                    draw_belts();
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
        var id = $("#person_id").val();
        var first_name = $("#first_name").val();
        var middle_name = $("#middle_name").val();
        var last_name = $("#last_name").val();
        var description = $("#description").val();
        var birth = $("#birth").val();
        var is_alive = $("#is_alive").prop('checked');
        var death = $("#death").val();
        var sex = $("input[name=sex]:checked").val();
        var location = $("#location").val();
        var relative_type = $("input[name=relative_type]:checked").val();
        var vk_id = $("#vk_id").val();
        $( this ).dialog( "close" );
        if (first_name == ''){
            $(this).dialog( "close" );
            $('#failed_message').text('Не указано имя!');
            $( "#dialog-message" ).dialog();
        }
        else
        $.get('/add', {
            first_name: first_name,
            middle_name: middle_name,
            last_name: last_name,
            description: description,
            birth: birth,
            is_alive: is_alive,
            death: death,
            sex: sex,
            location: location,
            relative_type: relative_type,
            from_id: id,
            vk_id: vk_id,
            user_id: window.user.id
        },  function(data) {
                $('#full_info_block').hide();
                flushFields();
                if (data['persons'] == -1){
                    $('#failed_message').text(data['Error']);
                    $("#dialog-message").dialog();
                    return '';
                }
                var cache = data
                var options = window.diagramSettings;
                if (id && relative_type == 'parent') {
                    $.get('/change', {
                        id: id,
                        new_id: data['new_id'],
                        sex: sex,
                        user_id: window.user.id
                    }, function(data) {
                       flushFields();
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
                 });
                }
                else {
                options.items = cache['persons'];
                    $("#diagram").famDiagram(options);
                    $("#diagram").famDiagram("update");
                    draw_belts();
                }
        });
    },
        id: "add_person"
  }]
  });

}

function edit_person_js(a) {
}

function add_person_js(a) {
    $('#full_info_block').tabs( "option", "active", 1 );
}

function add_link_js(a){
    $('#link-tip').hide();
    var item = a
    if ( window.link == 'listening' ){
        var person_id = $("#person_id").val();
        var link_id = $('#link_id').val();
        var relative_type = $("input[name=relative_type]:checked").val()
        link_id = $(item).find("[name=person_id]").val();
        if (link_id == person_id) {
            $('#failed_message').text('Привязка той же персоны!');
            $( "#dialog-message" ).dialog();
        }
        else
            $.get('/link', {
                person_id: person_id,
                link_id: link_id,
                relative_type: relative_type,
                user_id: window.user.id
                },
                function(data){
                    flushFields()
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
                    window.link = 'inactive';
                });
        }

        // Show full info and edit person
        $('#full_id').val($(a).find("[name=person_id]").val());
        var person_id = $(a).find('[name=person_id]').val();
        $("#person_id").val(person_id);
        var photo = $(a).find('[name=photo]').attr('src');
        $.get('/pull', {
                person_id: person_id
                },
                function(data){
                    var result = data['result'][0];
                    $('#full_photo').attr('src', photo);
                    if (result['alive'] == false) {
                        $('#full_death_belt').show();
                        var years = '...';
                        if (result['birth'])
                            years = result['birth'];
                        if (result['death'])
                            years += ' - ' + result['death'];
                        else
                            years += ' - ...'
                        $('#full_birth_death').text(years);
                        }
                    else {
                        var years = result['birth'];
                        $('#full_birth_death').text(years);
                        $('#full_death_belt').hide();
                    }
                    if (result['sex'] == 'F')
                        $('#full_info_block').css({'background': '#ffb1c7'});
                    else
                        $('#full_info_block').css({'background': '#88aae9'});
                    $('#full_name').text(result['first_name']);
                    $('#full_middle_name').text(result['middle_name']);
                    $('#full_last_name').text(result['last_name']);
                    $('#full_description').text(result['description']);
                    if (result['location'])
                        $('#full_location').text('Место рождения: ' + result['location']);
                    else
                        $('#full_location').text('');
                });
        $('#full_info_block').show();
        $( '#full_info_block').tabs( "option", "active", 0 );
        $('#full_close').click(function(){
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
                $.get('/remove', {
                person_id: person_id,
                user_id: window.user.id
                },
                function(data){
                    if (data['persons'] != -1){
                        var options = window.diagramSettings;
                        options.items = data['persons'];
                        $("#diagram").famDiagram(options);
                        $("#diagram").famDiagram("update");
                        draw_belts();
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
    }
