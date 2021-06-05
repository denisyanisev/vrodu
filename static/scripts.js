function draw_belts() {
    $('.bp-corner-all').each(function(){
        var alive = $(this).find("[name=alive]").val();
        if (alive=='False') {
            var death_belt = jQuery('<div name="death_belt"></div>').addClass("bp-item death_belt");
            $(this).append(death_belt);
        }
    });
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
    draw_belts();

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
});