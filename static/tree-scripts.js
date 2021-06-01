$(function() {$( "#draggable" ).draggable(); });

function open_input_block(){

$('#input_block').dialog({
    modal: true,
    close: function(){
        $('#new_person_label').hide();
        //$('#parent').prop('checked', true);
    },
    buttons: [{
        text: "Добавить",
        click: function(){
        $( this ).dialog( "close" );
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
            vk_id: vk_id
        },  function(data) {
                flushFields();
                if (data['persons'] == -1){
                    $('#failed_message').text(data['Error']);
                    $("#dialog-message").dialog();
                    console.log(data);
                    return '';
                }
                var cache = data
                var options = window.diagramSettings;
                if (id && relative_type == 'parent') {
                    $.get('/change', {
                        id: id,
                        new_id: data['new_id']
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
    root = $(a).parentsUntil(".bt-item-frame").parent()
    person_id = root.find("[name=person_id]").val();
    $("#person_id").val(person_id);
    $("#add-person").dialog({
        minWidth: 420,
        minHeight: 20,
        modal: true,
        closeOnEscape: true,
        buttons: [{
            text: "Добавить нового",
            id: 'add_person_button',
            click: function () {
                $(this).dialog("close");
                open_input_block();
            }
        },
        {
            text: "Связать существующего",
            click: function () {
                $(this).dialog("close");
                window.link = 'listening';
                $('#link-tip').show();
            }
        }]
    });
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
            $('#link_id').val(link_id);
            $.get('/link', {
                person_id: person_id,
                link_id: link_id,
                relative_type: relative_type
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
        $('#full_info_block').show();
        var target_id = $(a).find('[name=person_id]').val();
        var photo = $(a).find('[name=photo]').attr('src');
        $.get('/pull', {
                target_id: target_id,
                },
                function(data){
                    var result = data['result'][0];
                    console.log(result);
                    $('#full_photo').attr('src', photo);
                    console.log(result['alive']);
                    if (result['alive'] == false) {
                        $('#full_death_belt').show();
                        var years = '...';
                        if (result['birth'])
                            years = result['birth'];
                        if (result['death'])
                            years += ' - ' + result['death'];
                        else
                            years += result['birth'] + ' - ...'
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

        $('#full_close').click(function(){
            $('#full_info_block').hide();
        });
}

function remove_person_js(a){
    root = $(a).parentsUntil(".bt-item-frame").parent()
    person_id = root.find("[name=person_id]").val();
    title = root.find("[name=title]").text();
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
            },
            Cancel: function() {
              $( this ).dialog( "close" );
            }
          }
        });
    });
}
