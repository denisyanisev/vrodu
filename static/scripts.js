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

    $('.result_item').click(function(){
        var q_id = $(this).find('[name=q_id]');
        var q_first_name = $(this).find('[name=q_first_name]');
        var q_last_name = $(this).find('[name=q_last_name]');
        var q_sex = $(this).find('[name=q_sex]');
        var q_photo = $(this).find('[name=q_photo]');
        add_vk_person(q_id, q_first_name, q_last_name, q_sex, q_photo);
        alert('Персона добавлена!');
        VK.callMethod('showRequestBox', q_id, 'Вас добавили в родослувную. Присоединяйтесь!');
    });

    $( "#full_info_block" ).tabs();
});