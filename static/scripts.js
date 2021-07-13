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
    $("#input_block_modal input.flushable").val('');
    $("#input_block_modal textarea").val('');
    $('#male').prop('checked', true);
    $('#parent').prop('checked', true);
    $('#is_alive').prop('checked', true);
    $('#death_block').hide();
    $('#full_search_results').html('');
    $('#additional_info').collapse('hide');
    $('#maiden_name').hide();
}

function TreeSwitch(tree_id){
    window.tree_id = tree_id
	$.ajax({
	    type: 'POST',
        contentType: 'application/json; charset=utf-8',
	    url: '/update',
	    data: JSON.stringify({user_id: user.id, tree_id: tree_id}),	
   	    dataType: 'json',
	    success: function(data) {
		    setDiagramData(data['persons']);
            $('#full_info_block').hide();
            closeEdit();
            var confirms = data['persons'].filter(person => person['vk_confirm'] == 0 && person['vk_id'] == window.user.id)
            if (confirms.length > 0)
                {
                    confirm_person = confirms[0]
                    console.log(confirm_person.id)
                    centerOnPerson(confirm_person.id)
                    $('#confirmed_item').append('<span>' + confirm_person.first_name + ' ' + confirm_person.last_name + '</span><br />')
                    $('#confirmed_item').append('<img style="height: 100px" src="' + confirm_person.image + '"/><br />')
                    $('#confirmed_item').append('<span>ВК ID: </span><a href="vk.com/id' + confirm_person.vk_id + '">'
                    + confirm_person.vk_id + '</a>')
                    window.confirm_id = confirm_person.id
                    $('#confirm_vk').modal()
                }
        }
	});
}


$(document).ready(function () {
    $('#tree_list').menu();

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
            tree_id: window.tree_id
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
           $('#dialog-message').modal('hide');
           closeLink();
           closeEdit();
           control.setOption('cursorItem', null);
           control.update('Refresh');
        }
    });

    $('#vk_id').on('input', function(){
        var q = $(this).val();
        $('#full_search_results').show();
        getFriends(q);
    });

    $( "#full_info_block" ).tabs();

    var input = document.createElement('input'),
        supportedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    input.type = 'file';
    input.accept = supportedTypes.join(',');
    input.onchange = function(event) {          
        var photo = input.files[0];
        
        if (photo.size < 10484880){
            if (supportedTypes.includes(photo.type)){
                var reader = new FileReader;
                reader.onload = function(event){
                    var photoUrl = reader.result;
                    $('#photo-crop-block').modal();
                    $('#photo-crop').attr('src', photoUrl);
                    $('#photo-crop').croppie({
                        viewport: {
                            width: 150,
                            height: 150,
                            type: 'square'
                        },
                        boundary: {
                            width: 400,
                            height: 300
                            },
                        mouseWheelZoom: true,
                        //showZoomer: false,
                    });
                    $('#photo-crop-btn').on('click', function(event){
                        $('#photo-crop').croppie('result', {type: 'blob', size: 'viewport', format: 'jpeg', quality: 1
                        }).then(function(finPhoto){
                            var from_id = parseInt($('#person_id').val()),
                                extension = 'jpeg',
                                formData = new FormData();

                            formData.append('photo', finPhoto);
                            formData.append('from_id', from_id);
                            formData.append('ext', extension);
                            formData.append('user_id', window.user.id);

                            $.ajax({url : '/uploadphoto',
                                type : 'POST',
                                data : formData,
                                processData: false,
                                contentType: false,
                                success : function(data) {
                                    setDiagramData(data['persons']);
                                    show_full_info(data['persons'].find(person => person.id===from_id));
                                }
                            });
                        });
                        $('#photo-crop-block').modal('hide');
                    });
                    $('#photo-crop-block').on('hide.bs.modal', function(event){
                        $('#photo-crop-block').off('hide.bs.modal');
                        $('#photo-crop-btn').off('click');
                        $('#photo-crop').croppie('destroy');
                    });
                };
                reader.readAsDataURL(photo);
            }
            else {
                $('#failed_message').text('Фотография должна быть формата PNG, JPEG или WEBP');
                $("#dialog-message").modal();
            }
        } 
        else {
            $('#failed_message').text('Файл не должен превышать 10МБ!');
            $("#dialog-message").modal();
        }
    };

    $('#full_photo_upload').click(function(event){
        input.click();
        $('#full_photo_upload').mouseleave();
    });
    $('#full_photo_upload').hover(function(event){
        $('#full_photo_upload_img').show();
    }, function(event){
        $('#full_photo_upload_img').hide();
    });

    $('#photo_delete').click(function(event){
        $('#dialog-photo-confirm').modal('hide');
        $.ajax({url : '/deletephoto',
            type : 'POST',
            data : JSON.stringify({user_id: window.user.id, from_id: parseInt($('#full_id').val())}),
            contentType: 'application/json; charset=utf-8',
            success : function(data) {
                if (data['persons'] != -1){
                    setDiagramData(data['persons']);
                    show_full_info(data['persons'].find(person => person.id===parseInt($('#full_id').val())));
                }
            }
        });
    });

    $('#full_photo_delete').click(function(event){
        event.stopPropagation();
        $('#dialog-photo-confirm').modal();
    });

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

    $('#full_is_alive_edit').click(function(event){
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
            tree_id: window.tree_id
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

    $('#remove_spouse').click(event => {
        var spouseSelected = $('#full_spouses').children('.active');
        if (spouseSelected.length){
            var targetSpouseId = parseInt(spouseSelected.attr('person-id')),
                fromSpouseId = parseInt($("#full_id").val());
            var targetSpouse = control.getOption('items').find(person => person.id===targetSpouseId),
                fromSpouse = control.getOption('items').find(person => person.id===fromSpouseId);

            fromSpouse.spouses.splice(fromSpouse.spouses.indexOf(targetSpouseId), 1);
            var Request = {
                edit_person: true,
                from_id: fromSpouseId,
                spouses: fromSpouse.spouses,
                tree_id: window.tree_id
            };
            change_person(Request, true, 1);
            
            
            targetSpouse.spouses.splice(targetSpouse.spouses.indexOf(fromSpouseId));
            Request = {
                edit_person: true,
                from_id: targetSpouseId,
                spouses: targetSpouse.spouses,
                tree_id: window.tree_id
            }  
            change_person(Request, false);            
        }
        else {
            $('#failed_message').text('Не выбран брак для удаления');
            $("#dialog-message").modal();
        }            
    });

    $(".year-picker").datepicker({
        format: "yyyy",
        viewMode: "years",
        minViewMode: "years",
        autoclose:true
    });

    $("#link_map").click( function() {
        $('#map_modal').modal();
    });

    $("#center_on_person").click( function() {
        centerOnPerson(parseInt($('#person_id').val()));
    });

    // document.onwheel = function (event){
    //     event.preventDefault();
    //     const change = parseFloat($('#zoomSlider').val()) - Math.min(event.deltaY * 0.003, 0.125);
    //     $('#zoomSlider').val(change);
    //     zoomDiagram();
    // };

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
    });

    $("#not_confirm_person").click( function() {
        var Request = {
            edit_person: true,
            vk_confirm: 1,
            from_id: window.confirm_id,
            tree_id: window.tree_id
        }
        change_person(Request);
        $('#confirm_vk').modal('hide');
        $('#confirm_vk').empty()
    });

    $("#confirm_person").click( function() {
        var Request = {
            edit_person: true,
            vk_confirm: 2,
            from_id: window.confirm_id,
            tree_id: window.tree_id
        }
        change_person(Request);
        $('#confirm_vk').modal('hide');
        $('#confirm_vk').empty()
    });

    $(function() {

    });

});
