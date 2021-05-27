function draw_belts() {
    $('.bp-corner-all').each(function(){
        var alive = $(this).find("[name=alive]").val();
        if (alive=='False') {
            var death_belt = jQuery('<div name="death_belt"></div>').addClass("bp-item death_belt");
            $(this).append(death_belt);
        }
    });
}

function flashFields(){
        $("#input_block input.flushable").val('');
        $("#input_block textarea").text('');
        $('#parent').prop('checked', true);
        $('#is_alive').prop('checked', true);
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
});