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
        var relative = $("input[name=relative]:checked").val();
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
            relative: relative,
            parent: id,
            vk_id: vk_id
        },  function(data) {
                flashFields();
                if (data['persons'] == -1){
                    $('#failed_message').text(data['Error']);
                    $( "#dialog-message" ).dialog();
                    console.log(data);
                    return '';
                }
                var cache = data
                var options = window.diagramSettings;
                if (id && (relative == 'parent')) {
                    $.get('/change', {
                        id: id,
                        new_id: data['new_id']
                    }, function(data) {
                       flashFields();
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

function add_person_js(a){
	person_id = $(a).parent().find("[name=person_id]").val();
	$("#person_id").val(person_id);
	$("#add-person").dialog({
	    minWidth: 420,
	    minHeight: 20,
	    modal: true,
	    closeOnEscape: true,
	    buttons: [{
            text: "Добавить нового",
            id: 'add_person_button',
            click: function() {
              $( this ).dialog( "close" );
              open_input_block();
              }},
            {
            text: "Связать существующего",
            click: function() {
              $( this ).dialog( "close" );
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
        var relative = $("input[name=relative]:checked").val()
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
                relative: relative
                },
                function(data){
                    flashFields()
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
}

function remove_person_js(a){
    person_id = $(a).parent().find("[name=person_id]").val();
    title = $(a).parent().find("[name=title]").text();
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