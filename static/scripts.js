var hovered = false;
var fullSuggestView;
var inputGedcom; 

function draw_belts() {
    $('.bp-corner-all').each(function () {
        var alive = $(this).find('[name=alive]').val();
        if (alive == 'False') {
            var death_belt = jQuery('<div name="death_belt"></div>').addClass(
                'bp-item death_belt'
            );
            $(this).append(death_belt);
        }
    });
}

function closeEdit() {
    $('#full_edit').show();
    $('#full_edit_save').hide();
    $('#full_edit_cancel').hide();
    $('.full_field').prop('disabled', true);
    $('.full_field').removeClass('full_field_enabled');
    $('#bd_edit').hide();
    $('#full_birth_death').show();
    $('#vk_id_edit').hide();
    $('#vk_photo_temporary').val('');
    if (fullSuggestView) fullSuggestView.destroy(); 
}

function closeLink() {
    $('#link-tip').hide();
    window.link = 'inactive';
}

function flushFields() {
    $('#input_block_modal input.flushable').val('');
    $('#input_block_modal textarea').val('');
    $('#male').prop('checked', true);
    $('#is_alive').prop('checked', true);
    $('#death_block').hide();
    $('#full_search_results').html('');
    $('#full_search_results_single').html('');
    $('#full_search_results_single').hide();
    $('#additional_info').collapse('hide');
    $('#maiden_name').hide();
    $('#second_parent').children().not('option:last-child').remove();
    $('#second_parent').hide();
}


$(document).ready(function () {
    $('#a_megaphone').tooltip();
    $('#a_location').tooltip();
    $('#link_info').tooltip({'placement': 'bottom', 'trigger': 'hover'});
    $('#add_single').tooltip({'placement': 'bottom', 'trigger': 'hover'});
    $('#center_on_person').tooltip({'placement': 'bottom', 'trigger': 'hover'});
    $('#link_map').tooltip({'placement': 'bottom', 'trigger': 'hover'});
    $('#show_stats').tooltip({'placement': 'bottom', 'trigger': 'hover'});
    $('#gedcom_link').tooltip({'placement': 'right', 'trigger': 'hover'});
    $('#link_vk').tooltip({'placement': 'bottom', 'offset': [0, 10], 'trigger': 'hover'});

    $("#search_clear").click(function(){
        $("#search_input").val('');
        $('#search_dropdown').empty();
        $('#search_dropdown').hide();
    });

    $('#search_input').on('input', function () {
        var search_item = $(this).val();
        if (search_item.length == 0){
            $('#search_dropdown').empty();
            $('#search_dropdown').hide();
        }
        if (search_item.length > 2) {
            $.ajax({
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                url: '/search',
                data: JSON.stringify({
                    search_item: search_item,
                    tree_id: window.tree_id,
                }),
                dataType: 'json',
                success: function (data) {
                    $('#search_dropdown').show();
                    $('#search_dropdown').empty();

                    data['persons'].forEach((person) => {
                        var search_year = ''
                        if (person.last_name == '')
                            search_year = `(${person.birth}-${person.death})`
                        var res = `<li><a class="dropdown-item" href="#" onclick="centerOnPersonSearch(${person['_id']})">
                        ${person.first_name} ${person.last_name} ${person.middle_name} ${search_year}</a></li>`
                        $('#search_dropdown').append(res)
                    })
                    if (data['persons'] == -1) {
                        $('#failed_message').text(data['Error']);
                        dialog_message.show();
                    }
                    if (data['persons'].length == 0)
                        $('#search_dropdown').append('<li class="dropdown-item">???? ??????????????</li>');
                },
            });
        }
    });

    $('#vk_id_edit').on('input', function () {
        parseVkID($(this).val(), '#vk_id_edit');
    });

    $('#vk_id_single_number').on('input', function () {
        parseVkID($(this).val(), '#vk_id_single_number', true);
    });

    $('#tree_list').menu();

    $('#is_alive').click(function () {
        if ($('#is_alive').attr('checked') == 'checked') {
            $('#death_block').toggle();
        }
    });

    $('#parent').click(function () {
        $('#add-person').prev().find('span').text('???????????????? ????????????????');
    });

    $('#child').click(function () {
        $('#add-person').prev().find('span').text('???????????????? ??????????????');
    });

    $('#add_single').click(function () {
        $('#new_person').prop('checked', true);
        input_block_modal.show();
    });

    $('#add_person_button').click(function () {
        var person_id = parseInt($('#full_id').val());
        if ($('input[name=relative_type]:checked').val() == 'child') {
            control
                .getOption('items')
                .find((person) => person.id == person_id)
                .spouses.reverse().forEach((id) => {
                    var person = control
                        .getOption('items')
                        .find((person) => person.id == id);
                    $('#second_parent').prepend(
                        `<option person_id='${id}'>${person.title}</option>`
                    );
                    $('#second_parent').show();
                });
            $('#second_parent option:first-child').prop('selected', true);
        }
        $('#person_id').val(person_id);
        input_block_modal.show();
    });

    $('#add_person').click(function () {
        var Request = {
            first_name: $('#first_name').val(),
            middle_name: $('#middle_name').val(),
            last_name: $('#last_name').val(),
            description: $('#description').val(),
            birth: $('#birth').val(),
            is_alive: $('#is_alive').prop('checked'),
            death: $('#death').val(),
            sex: $('input[name=sex]:checked').val(),
            location: $('#location').val(),
            coordinate0: '',
            coordinate1: '',
            second_parent: '',
            relative_type: $('input[name=relative_type]:checked').val(),
            from_id: parseInt($('#person_id').val()),
            vk_id: parseInt($('#vk_id').val()),
            maiden_name: $('#maiden_name').val(),
            full_desc: $('#full_desc').val(),
            nationality: $('#nationality').val(),
            tree_id: window.tree_id,
            vk_id: $('#vk_id_single_number').val()
                ? $('#vk_id_single_number').val()
                : null,
            photo: $('#vk_photo_single').val(),
        };

        input_block_modal.hide();
        if (Request.first_name == '') {
            $('#failed_message').text('???? ?????????????? ??????');
            dialog_message.show();
            return;
        }
        if (
            $('#second_parent').children(':selected').length > 0 &&
            $('#second_parent').children(':selected').attr('person_id') != '-1'
        )
            Request.second_parent = parseInt(
                $('#second_parent').children(':selected').attr('person_id')
            );
        if (Request.location != '') {
            var myGeocoder = ymaps.geocode(Request.location);
            myGeocoder.then(function (data) {
                var coordinates = data.geoObjects
                    .get(0)
                    .geometry.getCoordinates();
                Request.coordinate0 = coordinates[0];
                Request.coordinate1 = coordinates[1];
                add_person_base(Request);
                return;
            });
        } else {
            add_person_base(Request);
            return;
        }
    });

    $('#input_block_modal').on('hidden.bs.modal', function (e) {
        flushFields();
        $('#parent').prop('checked', true);
        $('#input_block_modal .modal-content').css('background', '#d2e4fe');
    });

    $('#full_info_block').on('hide.bs.offcanvas', function(e){
        $('div.selected-border').remove();
        selectedItem = -1;
    });

    $('#full_delete').click(function () {
        delete_person_base(parseInt($('#full_id').val()));
    });

    $('#delete_person').click(function () {
        $('#dialog-confirm')[0].confirm = true;
        dialog_confirm.hide();
        full_info_block.hide();
        control.setOption('cursorItem', null);
    });

    $('#full_add_relation').click(function () {
        $('#full_relations_block').show();
    });

    const modal = $('#dialog-confirm')[0];
    $('#dialog-confirm').on('hide.bs.modal', function (e) {
        if (modal.confirm) {
            vk_id_del = control.getOption('items').find((person) => person.id == modal.person_id)['vk_id'];
            if (vk_id_del == window.tree_id) alert('???????????? ?????????????? ???????????????? ??????????????')
            else
            $.when(
                $.ajax({
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    url: '/remove',
                    data: JSON.stringify({
                        person_id: modal.person_id,
                        user_id: window.user.id,
                    }),
                    dataType: 'json',
                    success: function (data) {
                        if (data['persons'] == -1) {
                            $('#failed_message').text(data['Error']);
                            dialog_message.show();
                        }
                    },
                })
            ).then(function () {
                updateTree({});
            });
            modal.confirm = false;
            modal.person_id = undefined;
        }
    });
    
    $('#link_person_button').click(function () {
        var relative_type = $('input[name=relative_type_1]:checked').val();
        window.link = 'listening';
        window.linkType = relative_type;
        full_info_block.hide();
        $('#link-tip').show();
        var name = `${$('#full_last_name').val()} ${$('#full_name').val()} ${$('#full_middle_name').val()}`;
        if (relative_type == 'parent') $('#link-tip span').text(`???????????????? ???????????????? ?????? ${name}`);
        else if (relative_type == 'child') $('#link-tip span').text(`???????????????? ?????????????? ?????? ${name}`);
        else if (relative_type == 'spouse') $('#link-tip span').text(`???????????????? ??????????????(??) ?????? ${name}`);
    });

    $('#cancel_link_button').click(function () {
        closeLink();
    });

    $(document).on('keydown', function (event) {
        if (event.key == 'Escape') {
            full_info_block.hide();;
            dialog_message.hide();
            block_info.hide();
            input_block_modal.hide();
            dialog_confirm.hide();
            dialog_photo_confirm.hide();
            photo_crop_block.hide();
            closeLink();
            closeEdit();
            control.setOption('cursorItem', null);
            control.update('Refresh');
            selectedItem = -1;
        }
    });

    $('#vk_id').on('input', function () {
        var q = $(this).val();
        $('#full_search_results').show();
        if ($(this).val() == '') $('#full_search_results').hide();
        getFriends(q, '#full_search_results');
    });

    $('#vk_id_single').on('input', function () {
        var q = $(this).val();
        $('#full_search_results_single').show();
        if ($(this).val() == '') $('#full_search_results_single').hide();
        getFriends(q, '#full_search_results_single');
    });

    $('#full_info_block').tabs();

    inputGedcom = document.createElement('input');
    var supportedTypes = ['.ged'];
    inputGedcom.type = 'file';
    inputGedcom.accept = supportedTypes.join(',');
    inputGedcom.onchange = function (event) {
        var gedcom_file = inputGedcom.files[0];
        if (gedcom_file.size < 4096*1024) {
                uploadGedcom(gedcom_file, parseInt(window.tree_id), updateTree);
        } else {
            $('#failed_message').text('???????? ???? ???????????? ?????????????????? 4????!');
            dialog_message.show();
        }
    };

    $('#import-gedcom').click(function(){
        inputGedcom.click()
    });

    var inputPhoto = document.createElement('input'),
        supportedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    inputPhoto.type = 'file';
    inputPhoto.accept = supportedTypes.join(',');
    inputPhoto.onchange = function (event) {
        var photo = inputPhoto.files[0];

        if (photo.size < 10484880) {
            if (supportedTypes.includes(photo.type)) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    var photoUrl = reader.result;
                    $('#photo-crop').attr('src', photoUrl);
                    $('#photo-crop').croppie({
                        viewport: {
                            width: 150,
                            height: 150,
                            type: 'square',
                        },
                        boundary: {
                            width: 400,
                            height: 300,
                        },
                        mouseWheelZoom: true,
                        showZoomer: true,
                    });
                    $('input.cr-slider').attr('style', 'display:block;');
                    $('input.cr-slider').attr('class', 'form-range');
                    photo_crop_block.show();
                    $('#photo-crop-btn').on('click', function (event) {
                        $('#photo-crop')
                            .croppie('result', {
                                type: 'blob',
                                size: 'viewport',
                                format: 'jpeg',
                                quality: 1,
                            })
                            .then(function (result) {
                                var person_id = parseInt($('#person_id').val());
                                uploadPhoto(
                                    result,
                                    person_id,
                                    'jpeg',
                                ).then(function (){
                                    updateTree({tree_id: window.tree_id, person_id: person_id})
                                });
                            });
                        photo_crop_block.hide();
                    });
                    $('#photo-crop-block').on(
                        'hide.bs.modal',
                        function (event) {
                            $('#photo-crop-block').off('hide.bs.modal');
                            $('#photo-crop-btn').off('click');
                            $('#photo-crop').croppie('destroy');
                        }
                    );
                };
                reader.readAsDataURL(photo);
            } else {
                $('#failed_message').text(
                    '???????????????????? ???????????? ???????? ?????????????? PNG, JPEG ?????? WEBP'
                );
                dialog_message.show();
            }
        } else {
            $('#failed_message').text('???????? ???? ???????????? ?????????????????? 10????!');
            dialog_message.show();
        }
    };

    $('#full_photo_upload').click(function (event) {
        inputPhoto.click();
        $('#full_photo_upload').mouseleave();
    });
    $('#full_photo_upload').hover(
        function (event) {
            $('#full_photo_upload_img').show();
        },
        function (event) {
            $('#full_photo_upload_img').hide();
        }
    );

    $('#photo_delete').click(function (event) {
        dialog_photo_confirm.hide();
        var person_id = parseInt($('#full_id').val());
        $.when(
            $.ajax({
                url: '/deletephoto',
                type: 'POST',
                data: JSON.stringify({
                    user_id: window.user.id,
                    from_id: person_id,
                }),
                contentType: 'application/json; charset=utf-8',
            })
        ).then(function () {
            updateTree({ person_id: person_id });
        });
    });

    $('#full_photo_delete').click(function (event) {
        event.stopPropagation();
        dialog_photo_confirm.show();
    });

    $('#full_edit').click(function () {
        $(this).hide();
        var last_name = $('#full_last_name').val();
        var maiden_name_pattern = ' (' + $('#full_maiden_name').val() + ')';
        var last_name_cleared = last_name.replace(maiden_name_pattern, '');
        fullSuggestView = new ymaps.SuggestView('full_location', { results: 4, offset: [0, 5]});
        $('#full_last_name').val(last_name_cleared);
        $('#full_edit_cancel').show();
        $('#full_edit_save').show();
        $('.full_field').prop('disabled', false);
        $('.full_field').addClass('full_field_enabled');
        $('#bd_edit').show();
        $('#full_birth_death').hide();
        $('#vk_id_edit').show();
        $('#vk_id_edit').attr('hidden', false);
    });

    $('#full_is_alive_edit').click(function (event) {
        $('#full_death_edit').toggle();
        $('#bd-').toggle();
    });

    $('[name=sex]').change(function () {
        if ($('[name=sex]:checked').val() === 'F') $('#maiden_name').show();
        else $('#maiden_name').hide();
    });

    $('#full_edit_save').click(function () {
        var person_id = parseInt($('#full_id').val());
        var Request = {
            from_id: person_id,
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
            vk_id: parseInt($('#vk_id_edit').val())
        };
        if ($('#vk_photo_temporary').val())
            Request.image = $('#vk_photo_temporary').val();

        if (Request.location != '') {
            var myGeocoder = ymaps.geocode(Request.location);
            myGeocoder.then(function (data) {
                var coordinates = data.geoObjects
                    .get(0)
                    .geometry.getCoordinates();
                Request.coordinate0 = coordinates[0];
                Request.coordinate1 = coordinates[1];
                change_person(Request);
                updateTree({person_id: parseInt($('#full_id').val())});
            });
        } else {
            Request.coordinate0 = '';
            Request.coordinate1 = '';
            change_person(Request);
            updateTree({person_id: person_id});
        }
        closeEdit();
    });

    $('#full_edit_cancel').click(function () {
        closeEdit();
    });

    $('#remove_spouse').click((event) => {
        var spouseSelected = $('#full_spouses').children('.active');
        if (spouseSelected.length) {
            var targetSpouseId = parseInt(spouseSelected.attr('person-id')),
                fromSpouseId = parseInt($('#full_id').val());
            var targetSpouse = control
                    .getOption('items')
                    .find((person) => person.id === targetSpouseId),
                fromSpouse = control
                    .getOption('items')
                    .find((person) => person.id === fromSpouseId);

            fromSpouse.spouses.splice(
                fromSpouse.spouses.indexOf(targetSpouseId),
                1
            );
            var Request = {
                from_id: fromSpouseId,
                spouses: fromSpouse.spouses,
            };
            change_person(Request, true, 1);

            targetSpouse.spouses.splice(
                targetSpouse.spouses.indexOf(fromSpouseId)
            );
            Request = {
                from_id: targetSpouseId,
                spouses: targetSpouse.spouses,
            };
            change_person(Request, false);
            updateTree({ person_id: fromSpouseId, tab: 1 });
        } else {
            $('#failed_message').text('???? ???????????? ???????? ?????? ????????????????');
            dialog_message.show();
        }
    });

    $('#remove_children').click((event) => {
        var childrenSelected = $('#full_children').children('.active');
        if (childrenSelected.length) {
            var targetChildrenId = parseInt(childrenSelected.attr('person-id')),
            ParentId = parseInt($('#full_id').val());
            var targetChildren = control.getOption('items').find((person) => person.id === targetChildrenId)
            var parent_index = targetChildren.parents.indexOf(ParentId)
            var Request = { from_id: targetChildrenId }
            if (parent_index == 0)
                Request.parent_m = ''
            else if (parent_index == 1)
                Request.parent_f = ''
            else
                $('#failed_message').text('???????????? ???????????????? ????????????');

            change_person(Request);
            updateTree({ person_id: ParentId, tab: 1 });
        } else {
            $('#failed_message').text('???? ?????????????? ?????????? ?????? ????????????????');
            dialog_message.show();
        }
    });

    $('.year-picker').datepicker({
        format: 'yyyy',
        viewMode: 'years',
        minViewMode: 'years',
        autoclose: true,
    });

    $('#link_map').click(function () {
        map_modal.show();
    });

    $('#link_info').click(function () {
        block_info.show();
    });

    $('#center_on_person').click(function () {
        centerOnMe();
        // show_full_info(person);
    });

    $('#show_stats').click(function () {
        stats_modal.show();
    });

    $('#stats_modal').on('shown.bs.modal', function (e) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            url: '/stats',
            data: JSON.stringify({
                tree_id: window.tree_id,
                user_id: window.user.id,
            }),
            success: function (data) {
                if (data['persons'] == -1) {
                    $('#failed_message').text(data['Error']);
                    dialog_message.show();
                }
                $('#stat_span_all').html(data['all_persons']);
                $('#stat_span_vk').html(data['vk_persons']);
                $('#stat_span_verified').html(data['vk_persons_results']);
                $('#stat_fam').html('?????????? ?? ???????????????? "' + window.user.last_name + '": ');
                $('#stat_span_fam').html(data['my_families']);
                $('#stat_span_families').html(data['all_families']);
            },
        });
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
                user_id: window.tree_id,
            }),
            success: function (data) {
                $('#map_modal .modal-body').html(data);
            },
        });  
    });


    $('#map_modal').on('hidden.bs.modal', function (e) {
        $('#map_modal .modal-body').empty();
    });

    $('#not_confirm_person').click(function () {
        var Request = {
            vk_confirm: 1,
            from_id: window.confirm_id,
        };
        $('#arrow_tree').hide();
        $('#arrow_text').hide();
        change_person(Request);
        updateTree({});
        confirm_vk.hide();
    });

    $('#confirm_person').click(function () {
        var Request = {
            vk_confirm: 2,
            from_id: window.confirm_id,
        };
        $('#arrow_tree').hide();
        $('#arrow_text').hide();
        change_person(Request);
        updateTree({});
        confirm_vk.hide();
    });

    $('#remove_vk_link').click(function(){
        $.ajax({
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            url: '/unlink',
            data: JSON.stringify({
                tree_id: window.tree_id,
                user_id: window.user.id
            }),
            success: function (data) {
                console.log(data);
                $('#remove_vk_link').hide();
                $('#full_vk_link').hide();
            },
        })
    });

    (function(){
        var lock = false;
        $('#draggable').on('mousedown', (event) => {
            drag = false;
            lock = true;
        });

        $('#draggable').on('mousemove', (event) => {
            if (lock) {
                lock = false;
                timer = window.setTimeout(function(){
                    drag = true;
                }, 80);
            }
        });
    })();

    $('#female').click(function(){
        $('#input_block_modal .modal-content').css('background', '#ffbbc4');
    });

    $('#male').click(function(){
        $('#input_block_modal .modal-content').css('background', '#d2e4fe');
    });

    $('#search_input').click(function(){
        full_info_block.hide();
        $(this).focus();
    })

});

