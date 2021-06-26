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
    control.setOption('cursorItem', null);
    control.update('Refresh');
    $('#full_edit').show();
    $('#full_edit_save').hide();
    $('#full_edit_cancel').hide();
    $('#full_edit_save').hide();
    $('.full_field').prop('disabled', true);
    $('.full_field').removeClass('full_field_enabled');
    $('#bd_edit').hide();
    $('#full_birth_death').show();
    $('#full_maiden_name').val('');
}

function closeLink(){
    $('#link-tip').hide();
    window.link = 'inactive';
}

function flushFields(){
    $("#input_block_modal input.flushable").val('');
    $("#input_block_modal textarea").val('');
    $('#male').prop('checked', true);
    $('#parent').prop('checked', true);
    $('#is_alive').prop('checked', true);
    $('#death_block').hide();
    $('#full_search_results').html('');
    $('#additional_info').collapse('hide');
}

function TreeSwitch(tree_id){
        console.log(tree_id);
        window.tree_id = tree_id
	$.ajax({
	    type: 'POST',
            contentType: 'application/json; charset=utf-8',
	    url: '/update',
	    data: JSON.stringify({user_id: user.id, tree_id: tree_id}),	
   	    dataType: 'json',
	    success: function(data) {
		setDiagramData(data['persons'])	
            }	    
	});
    }


$(document).ready(function () {
    $('#is_alive').click(function(){
        if ($('#is_alive').attr("checked") == 'checked'){
            $('#death_block').toggle();
        }
    });

    $('#parent').click(function(){
        $('#add-person').prev().find('span').text('Добавить родителя');
    });

     $('#child').click(function(){
        $('#add-person').prev().find('span').text('Добавить ребенка');
    });

    $('#add_single').click(function(){
        $('#new_person').prop('checked', true);
        $('#input_block_modal').modal();
    });

    $('#add_person_button').click(function(){
        $('#person_id').val($('#full_id').val());
        $('#input_block_modal').modal();
    });

    $('#add_person').click(function(){
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
            maiden_name: $("#maiden_name").val(),
            full_desc: $("#full_desc").val(),
            nationality: $("#nationality").val(),
            user_id: window.user.id
            };
        $('#input_block_modal').modal("hide");
        if (Request.first_name == '') {
            $('#input_block_modal').modal('hide');
            $('#failed_message').text('Не указано имя');
            $("#dialog-message").modal();
            return;
        }        
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
    });

    $('#input_block_modal').on('hidden.bs.modal', function (e) {
       flushFields();
    })

    $('#full_delete').click(function(){
        delete_person_base(parseInt($("#full_id").val()));
    });

    $('#delete_person').click(function(){
        $('#dialog-confirm')[0].confirm = true;
        $('#dialog-confirm').modal('hide');
        $('#full_info_block').hide();
        control.setOption('cursorItem', null);
    });

    $('#full_add_relation').click(function(){
        $('#full_relations_block').show();
    });

    const modal = $('#dialog-confirm')[0];
    $('#dialog-confirm').on('hide.bs.modal', function(e){
        if (modal.confirm){
            $.ajax({
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                url: '/remove',
                data: JSON.stringify({
                    person_id: modal.person_id,
                    user_id: window.user.id
                }),
                dataType: 'json',
                success: function(data) {
                    if (data['persons'] != -1){
                        control.setOption('cursorItem', null);
                        setDiagramData(data['persons']);
                    }
                    else {
                        $('#failed_message').text(data['Error']);
                        $( "#dialog-message" ).modal();
                    }

                }
            });
            modal.confirm = false;
            modal.person_id = undefined;
        }
    });

    $('#link_person_button').click(function(){
        var relative_type = $("input[name=relative_type]:checked").val();
        window.link = 'listening';
        window.linkType = relative_type;
        $('#full_info_block').hide();
        $('#link-tip').show();
        var name = `${$('#full_last_name').val()} ${$('#full_name').val()} ${$('#full_middle_name').val()}`
        if (relative_type == 'parent')
            relative_type = 'родителя';
        else if (relative_type == 'child')
            relative_type = 'ребенка';
        $('#link-tip').children().filter('div').text(`Выберите ${relative_type} для ${name}`);
    });

    $('#link_marriage_button').click(function(){
        window.link = 'listening';
        window.linkType = 'spouse';
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
        var q = $(this).val();
        $('#full_search_results').show();
        getFriends(q);
    });

    $( "#full_info_block" ).tabs();

    $('#full_edit').click(function(){
        $(this).hide();
        var last_name = $('#full_last_name').val();
        var maiden_name_pattern = ' (' + $('#full_maiden_name').val() + ')';
        var last_name_cleared = last_name.replace(maiden_name_pattern, '');
        $('#full_last_name').val(last_name_cleared);
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

    $('[name=sex]').change(function(){
        if ($('[name=sex]:checked').val() === 'F') $('#maiden_name').show();
        else $('#maiden_name').hide();
    })

    $('#full_edit_save').click(function(){
        var Request = {
            edit_person: true,
            from_id: (parseInt($("#full_id").val())),
            first_name: $('#full_name').val(),
            middle_name: $('#full_middle_name').val(),
            last_name: $('#full_last_name').val(),
            description: $('#full_description').val(),
            birth: $('#full_birth_edit').val(),
            alive: $('#full_is_alive_edit').prop('checked'),
            death: $('#full_death_edit').val(),
            location: $('#full_location').val(),
            maiden_name: $('#full_maiden_name').val(),
            full_desc: $('#full_full_desc').val(),
            nationality: $('#full_nationality').val(),
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

    $("#link_map").click( function() {
        $('#map_modal').modal();
    });

    $('#map_modal').on('shown.bs.modal', function (e) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            url: '/map',
            data: JSON.stringify({
                user_id: window.user.id
            }),
            success: function(data){
                $("#map_modal .modal-body").empty();
                $("#map_modal .modal-body").append(data);
            }
        });
    })

});
