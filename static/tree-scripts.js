var control;

$(function() {$( "#draggable" ).draggable();});

function add_vk_person(vk_id, first_name, last_name, vk_sex, photo){
    var Request = {
    from_id: (parseInt($("#full_id").val())),
    first_name: first_name,
    middle_name: '',
    last_name: last_name,
    description: '',
    birth: '',
    is_alive: true,
    death: '',
    sex: (vk_sex == 2) ? 'M' : 'F',
    location: '',
    relative_type: $("input[name=relative_type]:checked").val(),
    vk_id: vk_id,
    photo: photo,
    tree_id: window.tree_id
    };
    add_person_base(Request);
}

function add_person_base(Request){
    $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/add',
        data: JSON.stringify(Request),
        dataType: 'json',
        success: function(data) {
            if (data['persons'] == -1){
                $('#failed_message').text(data['Error']);
                $("#dialog-message").modal();
                return;
            }
            var cache = data, new_id = cache['new_id'];
            if (Request.from_id != undefined && Request.relative_type == 'parent') {
                $.ajax({
                    'type': 'POST',
                    url: '/change',
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify({
                        from_id: Request.from_id,
                        new_id: data['new_id'],
                        sex: Request.sex,
                        tree_id: window.tree_id
                    }),
                    success: function(data) {
                        if (data['persons'] != -1){
                            control.setOption('cursorItem', new_id);
                            setDiagramData(data['persons']);
                            show_full_info(data['persons'].find(person => person.id===new_id));
                        }
                        else {
                            control.setOption('cursorItem', new_id);
                            setDiagramData(cache['persons']);
                            show_full_info(cache['persons'].find(person => person.id===new_id));
                        }
                    }
                });
            }
            else {
                control.setOption('cursorItem', new_id);
                setDiagramData(cache['persons']);
                show_full_info(cache['persons'].find(person => person.id===new_id));
            }
        }
    });
}

function change_person(Request){
    $.ajax({
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        url: '/change',
        data: JSON.stringify(Request),
        dataType: 'json',
        success: function(data) {
            if (data['persons'] != -1){
                updateDiagramData(data['persons']);
                show_full_info(data['persons'].find(person => person.id===Request.from_id));
            }
            else {
                $('#failed_message').text(data['Error']);
                $("#dialog-message").modal();
            }
        }
    });
}

function add_link_js(a, b){
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
        $( "#dialog-message" ).modal();
    }
    else {
        flushFields();
        $.ajax({
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            url: '/link',
            data: JSON.stringify({
                person_id: person_id,
                link_id: link_id,
                link_type: linkType,
                user_id: window.user.id
            }),
            dataType: 'json',
            success: function(data) {
                if (data['persons'] != -1){
                    setDiagramData(data['persons']);
                }
                else {
                    $('#failed_message').text(data['Error']);
                    $( "#dialog-message" ).modal();
                }
            }
        });
    }
    show_full_info(a);
}

// Show full info and edit person
function show_full_info(a) {
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
        if (a.birth)
            years = a.birth;
        if (a.death)
            years += ' - ' + a.death;
        else
            years += ' - ...'
        $('#full_birth_death').val(years);
    }
    else {
        $('#full_death_edit').hide();
        $('#full_is_alive_edit').prop('checked', true);
        var years = a.birth;
        $('#full_birth_death').val(years);
        $('#full_death_belt').hide();
    }
    if (a['sex'] == 'F'){
        $('#full_maiden_name').show();
        $('#full_info_block').css({'background': '#ffb1c7'});
    }
    else {
        $('#full_maiden_name').hide();
        $('#full_info_block').css({'background': '#88aae9'});
    }
    $('#full_name').val(a['first_name'] ? a['first_name'] : '');
    $('#full_middle_name').val(a['middle_name'] ? a['middle_name'] : '');
    $('#full_last_name').val(a['last_name'] ? a['last_name'] : '');
    $('#full_maiden_name').val(a['maiden_name'] ? a['maiden_name'] : '');
    $('#full_description').val(a['description'] ? a['description'] : '');
    $('#full_full_desc').val(a['full_desc'] ? a['full_desc'] : '');
    $('#full_nationality').val(a['nationality'] ? a['nationality']: '');
    $('#full_location').val(a['location'] ? a['location'] : '');
    
    $('#full_search_results').hide();
    $('#vk_id').val('');
    $('#full_info_block').show();
    $( '#full_info_block').tabs( "option", "active", 0 );
    $('#full_close').click(function(){
        $('#full_info_block').hide();
        closeEdit();
    });
}


var setDiagramData = function(persons){
    control.setOption('items', persons);
    control.update('Recreate', true);
    draw_belts();
}

var updateDiagramData = function(persons){
    if (persons) control.setOption('items', persons);
    control.update('Recreate', true);
    draw_belts();
}

var setDiagramOptions = function(){
    var options = new primitives.FamConfig();
    options.cursorItem = null;
    options.hasSelectorCheckbox = primitives.Enabled.False;
    options.buttonsPanelSize = 36;
    options.hasButtons = primitives.Enabled.Auto;
    options.pageFitMode = primitives.PageFitMode.None;
    options.onButtonsRender = function (data) {
        var itemConfig = data.context;
        var element = data.element;
        element.innerHTML = "";
        element.appendChild(primitives.JsonML.toHTML(["div",
            {
            class: "btn-group-vertical btn-group-sm",
            style: "display: block;"
            },
            ["button", 
                {
                    "type": "button",
                    "data-buttonname": "delete",
                    "class": "btn btn-light"
                },
                ["i", { "class": "fa fa-minus-circle" }]
            ],
            ["button", 
                {
                    "type": "button",
                    "data-buttonname": "add",
                    "class": "btn btn-light"
                },
                ["i", { "class": "fa fa-user-plus" }]
            ]
        ]));
    };
    options.normalLevelShift = 20;
    //options.dotLevelShift = 20;
    options.lineLevelShift = 30;
    options.normalItemsInterval = 15;
    //options.dotItemsInterval = 10;
    options.lineItemsInterval = 30;
    options.linesWidth = 1;
    options.linesColor = "#7C8993";
    options.navigationMode = primitives.NavigationMode['CursorOnly'];
    options.scale = 1;
    //options.pageFitMode = primitives.PageFitMode['FitToPage'];
    options.onCursorChanging = function(event, eventArgs){
        if (window.link == 'listening') add_link_js(eventArgs.context, eventArgs.oldContext);
    };
    options.onMouseClick = function(event, eventArgs){
        show_full_info(eventArgs.context);
        const x = eventArgs.position.x, y = eventArgs.position.y, scale = parseFloat($('#zoomSlider').val());
        $('#draggable').css({left:-x*scale+($(window).width()-parseInt($('#full_info_block').css('width')))/2, 
        top:Math.min(0,-y*scale+$(window).height()/2)});
    };
    options.onButtonClick = function(event, eventArgs){
        switch(eventArgs.name){
            case 'delete':
                delete_person_base(eventArgs.context.id);
                break;
            case 'add':
            {
                $('#person_id').val(eventArgs.context.id);
                $('#input_block_modal').modal();
                break;
            }
        }
    }
    options.defaultTemplateName = 'personTemplate1';
    options.templates = [getPersonsTemplates()];
    options.onItemRender = onTemplateRender;
    const myWidth = '2000px', myHeight = '2000px';
    control = primitives.FamDiagram(document.getElementById("diagram"), options);
    $("#diagram").css({
        width: myWidth,
        height: myHeight 
    });
    $('#draggable').css({
        width: myWidth
    });
};

var getPersonsTemplates = function() {
    var result = new primitives.TemplateConfig();
    result.name = 'personTemplate1';
    result.itemSize = new primitives.Size(152, 83);
    //result.itemSize = new primitives.Size(80, 36);
    //result.minimizedItemSize = new primitives.Size(3, 3);
    //result.highlightPadding = new primitives.Thickness(4, 4, 4, 4);

    result.itemTemplate = 
    `<div class=" bp-item bp-corner-all bt-item-frame" style="border-width: 1px;
        width: 151px;
        height: 83px;">
        <div name="titleBackground" class=" bp-item bp-corner-all bp-title-frame" style="
            top: 1px;
            left: 61px;
            width: 89px;
            height: 47px;
            background-color: rgb(255, 177, 199);">
            <div name="title" class=" bp-item bp-title" style="top: 1px; left: 4px; color: rgb(0, 0, 128);
                position: initial; font-size: 12px;">
            </div>
        </div>
        <div name="photoBorder" class=" bp-item bp-photo-frame" style="
            top: 3px;
            left: 2px;
            width: 57px;
            height: 57px;
            padding: 1px;
            float: left;">
            <img name="photo" style="width: 57px;">
            <div name="death_belt"></div>
        </div>
        <div name="description" class=" bp-item bp-description" style="
            bottom: 1px;
            left: 63px;
            width: 85px;
            max-height: 29px;">
        </div>
        <div class="years" style="
            bottom: 0px;
            left: 1px;
            text-align: center;
            position: absolute;
            width: 61px;
            font-size: 13px;">
        </div>
    </div>`
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
        titleFrame.style.backgroundColor = itemConfig.itemTitleColor;
        photo.src = itemConfig.image;
        if (data.context.alive === false) deathBelt.classList.add('death_belt');
        description.textContent = itemConfig.description;
        years.textContent = itemConfig.years;
    }
};

var delete_person_base = function(person_id) {
    const title = control.getOption('items').find(person => person.id === person_id).title;
    $('#deleted_item').text(title);
    $('#dialog-confirm')[0].person_id = person_id;
    $('#dialog-confirm').modal();
};

ymaps.ready(init);
function init() {
    var suggestView1 = new ymaps.SuggestView('location', {results: 4});
    var suggestView2 = new ymaps.SuggestView('full_location', {results: 4});
}

var zoomDiagram = function(){
    control.setOption('scale', parseFloat($('#zoomSlider').val()));
    control.update('Refresh');
};