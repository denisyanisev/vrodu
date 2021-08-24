var control,
    drag = false,
    selectedItem,
    oldContext,
    full_info_block = new bootstrap.Offcanvas($('#full_info_block')[0], {keyboard: true, focus: true}),
    dialog_message = new bootstrap.Modal($('#dialog-message')[0], {keyboard: true, focus: true}),
    input_block_modal = new bootstrap.Modal($('#input_block_modal')[0], {keyboard: true, focus: true}),
    dialog_confirm = new bootstrap.Modal($('#dialog-confirm')[0], {keyboard: true, focus: true}),
    block_info = new bootstrap.Modal($('#block_info')[0], {keyboard: true, focus: true}),
    map_modal = new bootstrap.Modal($('#map_modal')[0], {keyboard: true, focus: true}),
    dialog_photo_confirm = new bootstrap.Modal($('#dialog-photo-confirm')[0], {keyboard: true, focus: true}),
    confirm_vk = new bootstrap.Modal($('#confirm_vk')[0], {keyboard: true, focus: true}),
    photo_crop_block = new bootstrap.Modal($('#photo-crop-block')[0], {keyboard: true, focus: true});

function add_vk_person(
    vk_id,
    first_name,
    last_name,
    vk_sex,
    photo,
    relation,
    confirmed
) {
    var Request = {
        from_id: parseInt($('#full_id').val()),
        first_name: first_name,
        middle_name: '',
        last_name: last_name,
        description: '',
        birth: '',
        is_alive: true,
        death: '',
        sex: vk_sex == 2 ? 'M' : 'F',
        location: '',
        relative_type: relation
            ? relation
            : $('input[name=relative_type]:checked').val(),
        vk_id: vk_id,
        photo: photo,
        tree_id: window.tree_id,
        vk_confirm: confirmed ? 2 : 0,
    };
    add_person_base(Request);
}

function add_person_base(Request) {
    var new_id;
    $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/add',
        data: JSON.stringify(Request),
        dataType: 'json',
        success: function (data) {
            if (data['persons'] != 1) {
                $('#failed_message').text(data['Error']);
                dialog_message.show();
                return;
            } else {
                new_id = data['new_id'];
                var d1, d2;
                if (
                    Request.from_id != undefined &&
                    Request.relative_type == 'parent'
                ) {
                    d1 = $.ajax({
                        type: 'POST',
                        url: '/change',
                        contentType: 'application/json;charset=UTF-8',
                        data: JSON.stringify({
                            from_id: Request.from_id,
                            new_id: new_id,
                            sex: Request.sex,
                            tree_id: tree_id,
                        }),
                    });
                }
                if (Request.photo) {
                    d2 = $.Deferred();
                    fetch(Request.photo)
                        .then((res) => res.blob())
                        .then((result) => uploadPhoto(result, new_id, 'jpeg'))
                        .then((res) => d2.resolve());
                }
                $.when(d1, d2).then(function () {
                    selectedItem = new_id;
                    updateTree({ person_id: new_id }).then(() => {
                        window.oldContext = control.getOption('items').find((person) => person.id === new_id);
                        centerOnPerson(new_id);
                    });
                });
            }
        },
    });
}

function change_person(Request) {
    $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/change',
        data: JSON.stringify(Request),
        dataType: 'json',
    });
}

function add_link_js(a, b) {
    closeEdit();
    closeLink();
    var person_id = b.id,
        link_id = a.id,
        linkType;
    if (window.linkType) {
        linkType = window.linkType;
        window.linkType = undefined;
    }
    if (link_id == person_id) {
        $('#failed_message').text('Привязка той же персоны!');
        dialog_message.show();
    } else {
        flushFields();
        $.when(
            $.ajax({
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                url: '/link',
                data: JSON.stringify({
                    person_id: person_id,
                    link_id: link_id,
                    link_type: linkType,
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
            updateTree({ person_id: link_id });
        });
    }
}

function updateTree({
    tree_id = window.tree_id,
    person_id = -1,
    tab = 0,
    callback,
}) {
    return $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/update',
        data: JSON.stringify({ user_id: window.user.id, tree_id: tree_id }),
        dataType: 'json',
        success: function (data) {
            setDiagramData(data['persons']);
            if (selectedItem > -1) $(`[data-person-id=${selectedItem}]`).append('<div class="selected-border"></div>');
            $('#tree_list_dropdown li a').off();
            $('#tree_list_dropdown').empty();

            if (Object.keys(data['tree_list']).length) {
                for (tree in data['tree_list'])
		        {
                    $('#tree_list_dropdown').append(`<li><a class="dropdown-item" data-tree="${tree}" href="#">
                    Дерево ${window.user.last_name} & ${data['tree_list'][tree][1]}... (${data['tree_list'][tree][0]})</a></li>`);
                }
                $(`a.dropdown-item[data-tree=${window.user.id}]`).text(`Личное дерево (${data['tree_list'][window.user.id][0]})`);

                if (window.user.id === window.tree_id) $('#tree_list_placeholder').text('Личное дерево');
                else $('#tree_list_placeholder').text('Общее дерево');

                if (data['notifications_list'].length)
                $('#tree_list_placeholder').append('<span class="badge badge-light custom-badge">' + data['notifications_list'].length + '</span>')

                for (notification in data['notifications_list'])
                {
                    $('#tree_list_dropdown li a[data-tree="' + data['notifications_list'][notification] + '"]').append(
                    '<span class="badge badge-light custom-badge-list">1</span>')
                }
            }
            else {
                $('#tree_list_dropdown').append(
                    `<li><a class="dropdown-item" data-tree="${window.user.id}" href="#">Личное дерево (${data['tree_list'][window.user.id]})</a></li>`);
                $('#tree_list_placeholder').text('Личное дерево');
            }

            var confirms = data['persons'].filter((person) => person['vk_confirm'] == 0 && person['vk_id'] == window.user.id);	
            if (confirms.length > 0) {
                confirm_person = confirms[0];
                $('#confirmed_item').empty()
                $('#confirmed_item').append('<span>' + confirm_person.first_name + ' ' + confirm_person.last_name +
                '</span><br />');
                $('#confirmed_item').append('<img style="height: 100px" src="' + confirm_person.image + '"/><br />');
                $('#confirmed_item').append('<span>ВК ID: </span><a href="vk.com/id' + confirm_person.vk_id + '">' +
                confirm_person.vk_id + '</a>');
                window.confirm_id = confirm_person.id;
                confirm_vk.show();
            }

            $('#tree_list_dropdown [data-tree=' + window.tree_id + ']').addClass(['active', 'disable-links']);
            $('#tree_list_dropdown li a').on('click', function(){
                window.tree_id = parseInt(this.dataset.tree);
                updateTree({callback : function(){
                    centerOnMe();
                    full_info_block.hide();
                    closeEdit();
                }});
            });


            if (typeof person_id !== "undefined" && person_id > -1) {
                show_full_info(
                    data['persons'].find((person) => person.id === person_id),
                    tab
                );
            }
            if (callback) callback(data);
        },
    });
}

function uploadPhoto(photo, from_id, ext, callback = null) {
    var from_id = from_id,
        extension = ext,
        formData = new FormData();

    formData.append('photo', photo);
    formData.append('from_id', from_id);
    formData.append('ext', extension);
    formData.append('user_id', window.user.id);

    return $.ajax({
        url: '/uploadphoto',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (res) {
            if (callback) callback({ person_id: from_id });
        },
    });
}

// Show full info and edit person
function show_full_info(a, tab = 0) {
    closeEdit();
    var person_id = a.id;
    $('#full_id').val(person_id);
    var photo = a.image;
    $('#full_photo').attr('src', photo);
    $('#full_birth_edit').val(a.birth);
    $('#full_death_edit').val(a.death);
    if (a.alive === false) {
        $('#full_death_edit').show();
        $('#full_is_alive_edit').prop('checked', false);
        $('#full_death_belt').show();
        var years = '...';
        if (a.birth) years = a.birth;
        if (a.death) years += ' - ' + a.death;
        else years += ' - ...';
        $('#full_birth_death').val(years);
    } else {
        $('#full_death_edit').hide();
        $('#full_is_alive_edit').prop('checked', true);
        var years = a.birth;
        $('#full_birth_death').val(years);
        $('#full_death_belt').hide();
    }
    if (a['sex'] == 'F') {
        $('#full_maiden_name').show();
        $('#full_info_block').css({ background: '#ffb1c7' });
    } else {
        $('#full_maiden_name').hide();
        $('#full_info_block').css({ background: '#88aae9' });
    }
    $('#full_spouses').empty();
    $('#remove_spouse').hide();
    if (a.spouses.length) {
        var items = control.getOption('items');
        a.spouses.forEach((person_id) => {
            const person = items.find((person) => person.id === person_id);
            $('#full_spouses').append(
                '<a href="#" person-id=' +
                    person.id +
                    ' class="list-group-item">' +
                    person.title +
                    '</a>'
            );
        });
        $('#remove_spouse').show();
        $('#full_spouses a').click(function (event) {
            event.preventDefault();
            $('#full_spouses a').removeClass('active');
            $(this).addClass('active');
        });
    }
    $('#full_vk_text').empty();
    $('#full_vk_link').hide();
    $('#full_name').val(a['first_name'] ? a['first_name'] : '');
    $('#full_middle_name').val(a['middle_name'] ? a['middle_name'] : '');
    $('#full_last_name').val(a['last_name'] ? a['last_name'] : '');
    $('#full_maiden_name').val(a['maiden_name'] ? a['maiden_name'] : '');
    $('#full_description').val(a['description'] ? a['description'] : '');
    $('#full_full_desc').val(a['full_desc'] ? a['full_desc'] : '');
    $('#full_nationality').val(a['nationality'] ? a['nationality'] : '');
    $('#full_location').val(a['location'] ? a['location'] : '');
    $('#vk_id_edit').val(a['vk_id'] ? a['vk_id'] : '');
    if (a['vk_id']) {
        $('#full_vk_link').show();
        $('#full_vk_link').attr('href', 'https://vk.com/id' + a['vk_id']);
        $('#full_vk_link img').show();
        if (a['vk_confirm'] == 0) $('#full_vk_text').html('(Приглашение отправлено)');
        if (a['vk_confirm'] == 1) $('#full_vk_text').html('(Приглашение отклонено)');
        if (a['vk_confirm'] == 2) $('#full_vk_text').html('(Верифицировано)');
    }
    $('#full_search_results').hide();
    $('#full_search_results_single').hide();
    $('#vk_id').val('');
    if (photo.includes('male')) $('#full_photo_delete').hide();
    else $('#full_photo_delete').show();
    full_info_block.show();
    $('#full_info_block').tabs('option', 'active', tab);

    $('#person_id').val(a.id);
    $('#full_close').off('click');
    $('#full_close').click(function () {
        $('#full_info_block').hide();
        closeEdit();
    });
}

var setDiagramData = function (persons) {
    control.setOption('items', persons);
    control.update('Recreate', true);
    draw_belts();
    var treeWidth = parseInt($('#draggable').css('width')),
        treeHeight = parseInt($('#draggable').css('height')),
        windowWidth = parseInt($(window).width()),
        windowHeight = parseInt($(window).height());
    $('#draggable').draggable({
        scroll: false,
        containment: [
            -0.85 * treeWidth,
            -0.85 * treeHeight,
            windowWidth - 0.15 * treeWidth,
            windowHeight - 0.15 * treeHeight,
        ],
    });
};

var updateDiagramData = function (persons) {
    if (persons) control.setOption('items', persons);
    control.update('Recreate', true);
    if (selectedItem > -1) $(`[data-person-id=${selectedItem}]`).append('<div class="selected-border"></div>');
    draw_belts();
};

var setDiagramOptions = function () {
    var options = new primitives.FamConfig();
    options.cursorItem = null;
    options.hasSelectorCheckbox = primitives.Enabled.False;
    options.buttonsPanelSize = 36;
    options.hasButtons = primitives.Enabled.Auto;
    options.normalLevelShift = 20;
    options.lineLevelShift = 30;
    options.normalItemsInterval = 15;
    options.lineItemsInterval = 30;
    options.linesWidth = 1;
    options.linesColor = '#7C8993';
    options.navigationMode = primitives.NavigationMode['Inactive'];
    options.scale = 1;
    options.enablePanning = false;

    options.pageFitMode = primitives.PageFitMode.AutoSize;
    options.autoSizeMaximum = new primitives.Size(10000, 10000);
    const myWidth = 100,
        myHeight = 100;
    options.autoSizeMinimum = new primitives.Size(myWidth, myHeight);

    options.onMouseClick = function (event, eventArgs) {
        if (!drag) {
            if (window.link == 'listening') add_link_js(eventArgs.context, window.oldContext);
            window.oldContext = eventArgs.context;

            show_full_info(eventArgs.context);

            var item = event.target;
            if (!$(item).hasClass('bt-item-frame')){
                item = $(item).parents().filter('.bt-item-frame')[0];
            }
            $('div.selected-border').remove();
            $(item).append('<div class="selected-border"></div>');
            selectedItem = eventArgs.context.id;
        }
    };  
    options.onCursorChanging = function (event, eventArgs) {};
    options.onCursorChanged = function (event, eventArgs) {};
    options.defaultTemplateName = 'personTemplate1';
    options.templates = [getPersonsTemplates()];
    options.onItemRender = onTemplateRender;
    $('#diagram').css({
        width: myWidth,
        height: myHeight,
    });

    control = primitives.FamDiagram(
        document.getElementById('diagram'),
        options
    );
};

var getPersonsTemplates = function () {
    var result = new primitives.TemplateConfig();
    result.name = 'personTemplate1';
    result.itemSize = new primitives.Size(152, 83);

    result.itemTemplate = `<div class="bp-item bp-corner-all bt-item-frame">
        <div name="titleBackground" class="bp-item bp-corner-all bp-title-frame">
            <center><div name="title" class=" bp-item bp-title"></div></center>
        </div>
        <div name="photoBorder" class="bp-item bp-photo-frame" style="boarder-radius: 50%;">
            <img name="photo" style="width: 57px;">
            <div name="death_belt"></div>
        </div>
        <div name="description" class="bp-item bp-description"></div>
        <div class="years">
        </div>
    </div>`;
    return result;
};

var onTemplateRender = function (event, data) {
    switch (data.renderingMode) {
        case primitives.RenderingMode.Create:
            /* Initialize template content here */
            break;
        case primitives.RenderingMode.Update:
            /* Update template content here */
            break;
    }
    var itemConfig = data.context;

    if (data.templateName == 'personTemplate1') {
        var title = data.element.querySelector('.bp-title'),
            titleFrame = data.element.querySelector('.bp-title-frame'),
            photo = data.element.querySelector('img'),
            deathBelt = data.element.querySelector('div[name=death_belt]'),
            description = data.element.querySelector('.bp-description'),
            years = data.element.querySelector('.years');

        title.textContent = itemConfig.title;
        titleFrame.style.backgroundColor =
            data.context['sex'] == 'M' ? '#88aae9' : '#ffb1c7';
        
        if (data.context['vk_confirm'] == 0 || data.context['vk_confirm'] == 1)
            data.element.style.backgroundColor = '#8ceae5';
        if (data.context['vk_confirm'] == 2) {
            data.element.style.backgroundColor = '#8ceae5';
            var ver_div = document.createElement('div');
            ver_div.className = 'ver_div';
            ver_div.textContent = '✔';
            data.element.append(ver_div);
        }
        photo.src = itemConfig.image;
        if (data.context.alive === false) deathBelt.classList.add('death_belt');
        description.textContent = itemConfig.description;
        years.textContent = itemConfig.years;
        data.element.setAttribute('data-person-id', data.context.id);
    }
};

var delete_person_base = function (person_id) {
    const title = control
        .getOption('items')
        .find((person) => person.id === person_id).title;
    $('#deleted_item').text(title);
    $('#dialog-confirm')[0].person_id = person_id;
    dialog_confirm.show();
};

var centerOnPerson = function (personId) {
    const position = control.getPosition(personId).position,
        scale = parseFloat($('#zoomSlider').val());

    if (position) {
        const x = position.x * scale,
            y = position.y * scale,
            offsetWidth = parseInt($('#diagram').css('margin-left')) + parseInt($('#draggable').css('left')),
            offsetHeight = parseInt($('#diagram').css('margin-top')) + parseInt($('#draggable').css('top')),
            left = $(window).width() / 2 - x - offsetWidth - 100,
            top = $(window).height() / 2 - y - offsetHeight - 85;
        $('#draggable').css('transform', `translate(${left}px, ${top}px)`);
    }
};

var centerOnMe = function () {
    const items = control.getOption('items');
    const person = items.find((person) => person.vk_id == window.user.id);
    if (person) {
        $('div.selected-border').remove();
        selectedItem = person.id;
        $(`[data-person-id=${selectedItem}]`).append('<div class="selected-border"></div>');
        centerOnPerson(person.id);
    }
};

$('#draggable').on('mousedown', (event) => (drag = false));
$('#draggable').on('mousemove', (event) => (drag = true));

ymaps.ready(init);
function init() {
    var suggestView1 = new ymaps.SuggestView('location', { results: 4 });
    var suggestView2 = new ymaps.SuggestView('full_location', { results: 4 });
}

var zoomDiagram = function () {
    var width = parseInt($('#draggable').css('width')) / 2,
        height = parseInt($('#draggable').css('height')) / 3,
        scale = parseFloat($('#zoomSlider').val()),
        minWidth = 800 * scale,
        minHeight = 600 * scale;
    control.setOption('scale', scale);
    control.update('Refresh');
    if (selectedItem > -1) $(`[data-person-id=${selectedItem}]`).append('<div class="selected-border"></div>');
    $('#draggable').css({ 'min-width': minWidth, 'min-height': minHeight });
    var newWidth = parseInt($('#draggable').css('width')) / 2,
        newHeight = parseInt($('#draggable').css('height')) / 3;
    $('#draggable').css({
        left: parseInt($('#draggable').css('left')) + width - newWidth,
        top: parseInt($('#draggable').css('top')) + height - newHeight,
    });
};
