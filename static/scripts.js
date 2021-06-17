function draw_belts() {
    $('.bp-corner-all').each(function(){
        var alive = $(this).find("[name=alive]").val();
        if (alive=='False') {
            var death_belt = jQuery('<div name="death_belt"></div>').addClass("bp-item death_belt");
            $(this).append(death_belt);
        }
    });
}

function closeEdit(){
    $('#full_edit').show();
    $('#full_edit_save').hide();
    $('#full_edit_cancel').hide();
    $('#full_edit_save').hide();
    $('.full_field').prop('disabled', true);
    $('.full_field').removeClass('full_field_enabled');
    $('#bd_edit').hide();
    $('#full_birth_death').show();
}

function closeLink(){
    $('#link-tip').hide();
    window.link = 'inactive';
}

function flushFields(){
    $("#input_block input.flushable").val('');
    $("#input_block textarea").val('');
    $('#parent').prop('checked', true);
    $('#is_alive').prop('checked', true);
    $('#death_block').hide();
    $('#full_search_results').html('');
}

$(document).ready(function () {
    $('#is_alive').click(function(){
        if ($('#is_alive').attr("checked") == 'checked'){
            $('#death_block').toggle('slow', function(){});
        }
    });

    $('#parent').click(function(){
        $('#add-person').prev().find('span').text('Добавить родителя');
    });

     $('#child').click(function(){
        $('#add-person').prev().find('span').text('Добавить ребенка');
    });

    $('#add_single').click(function(){
        $('#new_person_label').show();
        $('#new_person').prop('checked', true);
        open_input_block();
    });

    $('#full_delete').click(function(){
        var person_id = (parseInt($('#full_id').val()));
        var title = $('#full_name').text();
        remove_person_js(person_id, title);
    });

    $('#full_add_relation').click(function(){
        $('#full_relations_block').show();
    });

    $('#link_person_button').click(function(){
        window.link = 'listening';
        window.type_of_link = 'parentship';
        $('#full_info_block').hide();
        $('#link-tip').show();
        var relative_type = $("input[name=relative_type]:checked").val();
        var name = `${$('#full_last_name').val()} ${$('#full_name').val()} ${$('#full_middle_name').val()}`
        if (relative_type == 'parent')
            relative_type = 'родителя';
        else if (relative_type == 'child')
            relative_type = 'ребенка';
        $('#link-tip').children().filter('div').text(`Выберите ${relative_type} для ${name}`);
    });

    $('#link_marriage_button').click(function(){
        window.link = 'listening';
        window.type_of_link = 'marriage';
        $('#full_info_block').hide();
        $('#link-tip').show();
        var name = `${$('#full_last_name').val()} ${$('#full_name').val()} ${$('#full_middle_name').val()}`
        $('#link-tip').children().filter('div').text(`Выберите супруга(у) для ${name}`);
    });

    $('#cancel_link_button').click(function(){
        closeLink();
    });

    $(document).on('keydown', function(event) {
        if (event.key == "Escape") {
           $('#full_info_block').hide();
           closeLink();
           closeEdit();
        }
    });

    $('#vk_id').on('input', function(){
        console.log($(this).val());
        var q = $(this).val();
        $('#full_search_results').show();
        getFriends(q);
    });

    $( "#full_info_block" ).tabs();

    $('#full_edit').click(function(){
        $(this).hide();
        $('#full_edit_cancel').show();
        $('#full_edit_save').show();
        $('.full_field').prop('disabled', false);
        $('.full_field').addClass('full_field_enabled');
        $('#bd_edit').show();
        $('#full_birth_death').hide();
    });

    $('#full_is_alive_edit').click(function(){
        $('#full_death_edit').toggle();
        $('#bd-').toggle();
    });


    $('#full_edit_save').click(function(){
        var Request = {
            edit_person: true,
            from_id: (parseInt($("#person_id").val())),
            first_name: $('#full_name').val(),
            middle_name: $('#full_middle_name').val(),
            last_name: $('#full_last_name').val(),
            description: $('#full_description').val(),
            birth: $('#full_birth_edit').val(),
            alive: $('#full_is_alive_edit').prop('checked'),
            death: $('#full_death_edit').val(),
            location: $('#full_location').val(),
            user_id: window.user.id
        };
        if (Request.location != '') {
            var myGeocoder = ymaps.geocode(Request.location);
            myGeocoder.then(function(data){
                var coordinates = data.geoObjects.get(0).geometry.getCoordinates();
                Request.coordinate0 = coordinates[0];
                Request.coordinate1 = coordinates[1];
                change_person(Request);
            });
        }
        else {
            Request.coordinate0 = '';
            Request.coordinate1 = '';
            change_person(Request);
        }
        closeEdit();
    });

    $('#full_edit_cancel').click(function(){
        closeEdit();
    })

    $(".year-picker").datepicker({
        format: "yyyy",
        viewMode: "years",
        minViewMode: "years",
        autoclose:true
    });

    $("#map_dialog").dialog({
        autoOpen: false,
        position: 'center' ,
        draggable: false,
        width : 550,
        height : 460,
        resizable : false,
        modal : true,
    });

    $("#link_map").click( function() {
        $("#map_dialog").load('/map/' + window.user.id, function() {
            $("#map_dialog").dialog("open");
        });
    })

});