var control;

$(function() {$( "#draggable" ).draggable();});

function add_vk_person(vk_id, first_name, last_name, vk_sex, photo){
    var Request = {
    from_id: (parseInt($("#person_id").val())),
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
    user_id: window.user.id
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
            $('#full_info_block').hide();
            if (data['persons'] == -1){
                $('#failed_message').text(data['Error']);
                $("#dialog-message").modal();
                return;
            }
            var cache = data;
            if (Request.from_id != null && Request.relative_type == 'parent') {
                $.ajax({
                    'type': 'POST',
                    url: '/change',
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify({
                        from_id: Request.from_id,
                        new_id: data['new_id'],
                        sex: Request.sex,
                        user_id: window.user.id
                    }),
                    success: function(data) {
                       if (data['persons'] != -1){
                            setDiagramData(data['persons']);
                       }
                       else {
                            setDiagramData(cache['persons']);
                       }
                    }
                });
            }
            else {
            setDiagramData(cache['persons']);
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
                setDiagramData(data['persons']);
            }
            else {
                $('#failed_message').text(data['Error']);
                $("#dialog-message").modal();
            }
        }
    });
}

function add_person_js(a, b) {
    show_full_info(a);
    $('#full_info_block').tabs( "option", "active", 1 );
    b.stopPropagation();
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
    var person_id = a.id;
    $('#full_id').val(person_id);
    $("#person_id").val(person_id);
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
    if (a['first_name']) $('#full_name').val(a['first_name']);
    if (a['middle_name']) $('#full_middle_name').val(a['middle_name']);
    if (a['maiden_name']) {
        $('#full_last_name').val(a['last_name'] + ' (' + a['maiden_name'] + ')');
        $('#full_maiden_name').val(a['maiden_name']);
    }
    else
        $('#full_last_name').val(a['last_name']);
    if (a['description']) $('#full_description').val(a['description']);
    if (a['short_desc']) $('#full_short_desc').val(a['short_desc']);
    if (a['nationality']) $('#full_nationality').val(a['nationality']);
    if (a['location'])
    {
        $('#full_location').val(a['location']);
    }
    else
    {
        $('#full_location').val('');
    }
    $('#full_search_results').hide();
    $('#vk_id').val('');
    $('#full_info_block').show();
    $( '#full_info_block').tabs( "option", "active", 0 );
    $('#full_close').click(function(){
        closeEdit();
        $('#full_info_block').hide();
    });
}


var setDiagramData = function(persons){
    control.setOption('items', persons);
    control.update('Recreate');
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
            class: "btn-group-vertical btn-group-sm"
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
    //options.elbowType = primitives.ElbowType.Round;
    options.normalLevelShift = 20;
    options.dotLevelShift = 20;
    options.lineLevelShift = 20;
    options.normalItemsInterval = 10;
    options.dotItemsInterval = 10;
    options.lineItemsInterval = 50;
    options.linesWidth = 1;
    options.linesColor = "#7C8993";
    options.onCursorChanging = function(event, eventArgs){
        if (window.link == 'listening') add_link_js(eventArgs.context, eventArgs.oldContext);
    };
    options.onCursorChanged = function(event, eventArgs){
        show_full_info(eventArgs.context);
    };

    control = primitives.FamDiagram(document.getElementById("diagram"), options);
    var placeholder = $(".placeholder");
    $("#diagram").css({
        width: placeholder.width(),
        height: placeholder.height(),
    });

}




ymaps.ready(init);
function init() {
    var suggestView1 = new ymaps.SuggestView('location', {results: 4});
    var suggestView2 = new ymaps.SuggestView('full_location', {results: 4});
    }
