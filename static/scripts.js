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
        var person_id = $('#full_id').val();
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
        $('#link-tip').show()
    });

    $('#link_marriage_button').click(function(){
        window.link = 'listening';
        window.type_of_link = 'marriage';
        $('#full_info_block').hide();
        $('#link-tip').show()
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
        if ($('#full_is_alive_edit').attr("checked") == 'checked'){
            $('#full_death_edit').prop('disabled', false);
        }
        else
            $('#full_death_edit').prop('disabled', true);
    });

    $('#full_edit_save').click(function(){
        var ChangeRequest = {
            edit_person: true,
            from_id: $("#person_id").val(),
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
        change_person(ChangeRequest);
        closeEdit();
    });

    $('#full_edit_cancel').click(function(){
        closeEdit();
    })
//    $("#full_birth_edit").datepicker({
//        format: "yyyy",
//        viewMode: "years",
//        minViewMode: "years"
//    });

});