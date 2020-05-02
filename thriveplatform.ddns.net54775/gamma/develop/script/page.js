require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/ImageryLayer",
    "esri/widgets/TimeSlider",
  ], function(Map, MapView, ImageryLayer, TimeSlider, Expand, Legend) {

// Take the data from range.
// Create timeSlider.

var pagePHPPath = '../php/page.php'; 
var chartPHPPath = '../php/chart_data.php';
var DTVue;
var tableTabFrameToBeActive = false;
var chartTabFrameToBeActive = false;
var arrayOfPins = [];
var tableActiveIndex;
var chartActiveIndex;
var dashboardIndex = 0;
var treePathData;
var tableExample;
var activeTableData;
var weightIndex = 2;
var subCheckboxIndex  = 1;

var chartSelection = {};
var legendSelection = {};
var labelSelection = {};

// visible: (arr[0][1] == "true"||arr[0][1] === true) ? true : false,
// searchable:(arr[0][1] == "true"||arr[0][1] === true) ? true : false, ,
//     visible: true,
//         searchable: true

var childHeading = [
    {title: "record_pos",
    data: "record_pos",
    visible: false,
    searchable: false},
    {title:"sub_checkbox",
    data: "sub_checkbox",
    visible: true,
    searchable: true},
    {title: "weight",
    data: "weight",
    visible: true,
    searchable: true},
    {title: "entity_id",
    data: "entity_id",
    visible: true,
    searchable: true},    
    {title:"entity_name", 
    data:"entity_name",
    visible: true,
    searchable: true},
    {title:"class_path_id", 
    data:"class_path_id",
    visible: true,
    searchable: true},
    {title:"allocation", 
    data:"allocation",
    visible: true,
    searchable: true},
    {title:"inner_limit", 
    data:"inner_limit",
    visible: true,
    searchable: true},
    {title:"outer_limit", 
    data:"outer_limit",
    visible: true,
    searchable: true},
    {title: "score", 
    data: "score",
    visible: true,
    searchable: true}
]
    
// require([]);

function create_sub_score_datatable(mainTableNum, childTableNum){
    return `<table id=childTableDT_${mainTableNum}_${childTableNum}>
  </table>`;
}

function getIdsFromTree(data){
    nodeList = [];
    tmpList =  data.instance.get_node(data.node.id);

    tmpList.parents.forEach((element)=> {
            nodeList.push(element);
        }
    );
    nodeList = nodeList.filter(element => element != '#');
    
    // // console.log(tmpList.state.opened);
    // Put the child at the end if the 
    // the button is opened.
    if(tmpList.state.opened && tmpList.state.selected){
        nodeList.unshift(data.node.id);
    }

    return nodeList;
}

// ---------------------------------------------
// -- Function for creating a subtable ---------
// ---------------------------------------------
function getEntityIdsFromTree(data){
    nodeList = getIdsFromTree(data);
    idList = [];
    nodeList.forEach(element => {
        idList.push(data.instance.get_node(element.toString()).li_attr['data-entity-id']);
    });
    
    // Put a last element at the front.
    // tmp = idList.pop();
    // idList.unshift(tmp);
    return idList.reverse();
}


// Function for updating sub-table.
function updateSubtableSettings(tableActiveIndex, rowNum){
    var subCheckboxSelected;
    var weightData;
    // Get the stored data from user's settings. 
    


    var tr = $(`#tableDT_${tableActiveIndex}`).DataTable();

    var rowData = tr.row(rowNum).data();

    if(DTVue.userData.userSettings.tab[tableActiveIndex].subCheckboxSelected){
        subCheckboxSelected = 
        DTVue.userData.userSettings.tab[tableActiveIndex].subCheckboxSelected;
        if(!DTVue.userData.userSettings.tab[tableActiveIndex].subCheckboxSelected[rowData.checkbox]) {
            // subCheckboxSelected = {};
            subCheckboxSelected[rowData.checkbox] = []
        }
    }
    else {
        subCheckboxSelected = {};
        subCheckboxSelected[rowData.checkbox] = []
    }
    
    if(DTVue.userData.userSettings.tab[tableActiveIndex].weightData){
        weightData = 
        DTVue.userData.userSettings.tab[tableActiveIndex].weightData;
        if(!DTVue.userData.userSettings.tab[tableActiveIndex].weightData[rowData.checkbox]) {
            // subCheckboxSelected = {};
            weightData[rowData.checkbox] = []
        }
    }
    else {
        weightData = {};
        weightData[rowData.checkbox] = []
    }

    // ----------------------------------------------
    // Save all weight values stored in datatable ---
    // ----------------------------------------------
    tr = $(`#childTableDT_${tableActiveIndex}_${rowNum}`).DataTable();
    
    tr.rows().indexes().map(
        function(rowIndex) {

            // Only takes the current data.
            weightData[rowData.checkbox][ tr.cell(rowIndex, 0).data()] =
            $($(`#childTableDT_${tableActiveIndex}_${rowNum}
            input[data-record-pos='${tr.cell(rowIndex, 0).data()}']`)[0]).val(); 
            
            // Save weight data to weight settings if changed.
            Vue.set(DTVue.userData.userSettings.tab[tableActiveIndex], 'weightData',
            weightData);
        }
    );
    // ---------------------------------------------
    // ---------------------------------------------    

    
    // ---------------------------------------------
    // Save  ticked checkboxes ------------------
    // ---------------------------------------------
    // Put an index from checkboxSelected if the checkbox is checked
    tr.rows(`#childTableDT_${tableActiveIndex}_${rowNum}  .selected`).indexes().map(
        function(rowIndex){
            // console.log(tr.cell(rowIndex, checkboxIndex).data());
            var selected = tr.cell(rowIndex, subCheckboxIndex).data().toString();
            var index = subCheckboxSelected[rowData.checkbox].indexOf(selected);
            if(index < 0){
                subCheckboxSelected[rowData.checkbox].push(selected);
            }
            
    });
    
    // Remove an index from checkboxSelected if the checkbox is not checked
    tr.rows(`#childTableDT_${tableActiveIndex}_${rowNum} :not(.selected)`).indexes().map( 
        function(rowIndex) {
          var notSelected = tr.cell(rowIndex, subCheckboxIndex).data().toString();
            var index = subCheckboxSelected[rowData.checkbox].indexOf(notSelected);
            if(index > -1){
                subCheckboxSelected[rowData.checkbox].splice(index, 1);
            }
    })
    
    // Save the info about the checkbox data of table:
    // console.log(checkboxSelected);
    Vue.set(DTVue.userData.userSettings.tab[tableActiveIndex], 'subCheckboxSelected',
    subCheckboxSelected);
}



// Create sub-score table.
function createSubTable(tableIndex,tr,row,rowNum,rowData,weightData) {

    // =======================================================
    // == Check checkbox & weight data existence =============
    // =======================================================
    var subCheckboxSelected;
    var weightData;
    // Get the stored data from user's settings. 
    if(DTVue.userData.userSettings.tab[tableIndex].subCheckboxSelected){
        subCheckboxSelected = 
        DTVue.userData.userSettings.tab[tableIndex].subCheckboxSelected;
        if(!DTVue.userData.userSettings.tab[tableIndex].subCheckboxSelected[rowData.checkbox]) {
            // subCheckboxSelected = {};
            subCheckboxSelected[rowData.checkbox] = []
        }
    }
    else {
        subCheckboxSelected = {};
        subCheckboxSelected[rowData.checkbox] = []
    }
    
    if(DTVue.userData.userSettings.tab[tableIndex].weightData){
        weightData = 
        DTVue.userData.userSettings.tab[tableIndex].weightData;
        if(!DTVue.userData.userSettings.tab[tableIndex].weightData[rowData.checkbox]) {
            // subCheckboxSelected = {};
            weightData[rowData.checkbox] = []
        }
    }
    else {
        weightData = {};
        weightData[rowData.checkbox] = []
    }

    // =======================================================
    // =======================================================

    var session_id = rowData.session_id;
    var fe_id = rowData.fe_id;
    var wf_id = rowData.wf_id;

    var class_path_id = rowData.class_path_id;

    if ( row.child.isShown() ) {

        // If the table has closed, then all weight and checkbox data are stored.
        updateSubtableSettings(tableIndex, rowNum);
        row.child.hide();

        // Store weight & checkbox info.
        tr.removeClass('shown');
    }
    else {
        row.child( create_sub_score_datatable(tableIndex, rowNum) ).show();
        tr.addClass('shown');
        var table = $(`#childTableDT_${tableIndex}_${rowNum}`).DataTable({
            // dom: 'Blfrtip',
            "processing": true,
            "serverSide": true,
            colReorder: true,
            paging: true,
            select: {
                style: "multi"
            },
            
            // buttons: columnButtons,
            "ajax": {
                // Send user's data using ajax call.
                method: "POST",
                url: "../php/subtable_pagination.php",
                data: function (d){
                    var tmp_arr = [];

                    if($.fn.dataTable.isDataTable(`#childTableDT_${tableIndex}_${rowNum}`)){

                        // ---------------------------------------------
                        // Save all weight values stored in datatable--
                        // ---------------------------------------------
                        // tr = $(`#childTableDT_${tableIndex}_${rowNum}`).DataTable();
                        updateSubtableSettings(tableIndex, rowNum)
                        // tr.rows().indexes().map(
                        //     function(rowIndex) {
                        //         // Only takes the current data.
                        //         weightData[rowData.checkbox][tr.cell(rowIndex, 0).data()] =
                        //         $($(`#childTableDT_${tableIndex}_${rowNum}
                        //         input[data-record-pos='${tr.cell(rowIndex, 0).data()}']`)[0]).val(); 
                                
                        //         // Save weight data to weight settings if changed.
                        //         Vue.set(DTVue.userData.userSettings.tab[tableIndex], 'weightData',
                        //         weightData);
                        //     }
                        // );
                        // // ---------------------------------------------
                        // // ---------------------------------------------    

                        
                        // // ---------------------------------------------
                        // // Save  ticked checkboxes ------------------
                        // // ---------------------------------------------
                        // // Put an index from checkboxSelected if the checkbox is checked
                        // tr.rows(`#childTableDT_${tableIndex}_${rowNum}  .selected`).indexes().map(
                        //     function(rowIndex){
                        //         // console.log(tr.cell(rowIndex, checkboxIndex).data());
                        //         var selected = tr.cell(rowIndex, subCheckboxIndex).data().toString();
                        //         var index = subCheckboxSelected[rowData.checkbox].indexOf(selected);
                        //         if(index < 0){
                        //             subCheckboxSelected[rowData.checkbox].push(selected);
                        //         }
                                
                        // });
                        
                        // // Remove an index from checkboxSelected if the checkbox is not checked
                        // tr.rows(`#childTableDT_${tableIndex}_${rowNum} :not(.selected)`).indexes().map( 
                        //     function(rowIndex) {
                        //       var notSelected = tr.cell(rowIndex, subCheckboxIndex).data().toString();
                        //         var index = subCheckboxSelected[rowData.checkbox].indexOf(notSelected);
                        //         if(index > -1){
                        //             subCheckboxSelected[rowData.checkbox].splice(index, 1);
                        //         }
                        // })
                        
                        // // Save the info about the checkbox data of table:
                        // // console.log(checkboxSelected);
                        // Vue.set(DTVue.userData.userSettings.tab[tableIndex], 'subCheckboxSelected',
                        // subCheckboxSelected);

                        // ---------------------------------------------
                        // --------------------------------------------- 
                    
                    }

                    console.log(DTVue.userData.userSettings.tab[tableIndex].subCheckboxSelected);

                    // console.log(weightData);

                    // ------------------------------------
                    // ------------------------------------

                    return $.extend({}, 
                        d,
                        {sessionId: session_id,
                        wfId: wf_id,
                        feId: fe_id,
                        classId: class_path_id,
                        weightData: weightData}
                    ); 
                }
                ,
                dataSrc: function(json) {
                   
                    if(!DTVue.userData.userSettings.
                        tab[tableIndex].
                        weightData) 
                    {
                        Vue.set(DTVue.userData.userSettings.
                        tab[tableIndex], 'weightData', {});
                    }

                    if(!DTVue.userData.userSettings.
                        tab[tableIndex].
                        weightData[rowData.checkbox]){
                            weightData[rowData.checkbox] = {}
                    }
                    else {
                            weightData[rowData.checkbox] = DTVue.userData.userSettings.
                            tab[tableIndex].
                            weightData[rowData.checkbox]
                    }

                    // console.log(json);
                    // console.log(json.data);
                    return json.data;
                }
                
            },
            columns: childHeading
            ,
            columnDefs:[
            
            // Create checkbox
            {
                'targets': subCheckboxIndex,
                defaultContent: '',
                orderable: false,
                searchable: false,
                className: 'select-checkbox',

                // Add selected rows.
                createdCell:  function (td, cellData, rowData, row, col) {
                    // This data will be stored after
                    $(td)
                    .addClass('sub-table-checkbox')
                    .attr('data-table-index', tableIndex)
                    .attr('data-sub-table-rowNum', rowNum)
                    .attr('data-record-pos', rowData.record_pos);
                },
                title: `sub_checkbox`,
                'render': function (){
                    return ``;
                }
            },

            // Create weight input.
            {
                'targets': weightIndex,
                defaultContent: '',
                orderable: false,
                searchable: false,
                createdCell:  function (td, cellData, rowData, row, col) {
                    $(td)
                    .attr('data-table-index', tableIndex)
                    .attr('data-sub-table-rowNum', rowNum)
                    .attr('data-record-pos', rowData.record_pos);
                },
                'render': function (data, type, row, meta){
                    // --------------------------------------
                    // Put weight data using user settings---
                    // --------------------------------------

                    if(weightData[rowData.checkbox][row.record_pos]){
                        return `<input class = 'subtable-weight-input' data-table-index="${tableIndex}"
                        data-sub-table-rowNum="${rowNum}"
                        data-record-pos="${row.record_pos}"
                        value="${weightData[rowData.checkbox][row.record_pos]}">`;
                    }

                    // Otherwise, use weight data from the database.
                    else {
                        return `<input class = 'subtable-weight-input' data-table-index="${tableIndex}"
                        data-sub-table-rowNum="${rowNum}"
                        data-record-pos="${row.record_pos}"
                        value="${row.weight}">`;
                    }

                    // -------------------------------------------
                    // -------------------------------------------
                    
                }
            }]
            // End of definition
            ,

            "rowCallback" : function (row, data){

                // console.log($(row).find('.select-checkbox')[0]);
                if(subCheckboxSelected[rowData.checkbox]){
                    var tmpStr = String($($(row).find('.select-checkbox')[0]).attr('data-record-pos'));
                    console.log(tmpStr);
                    if(subCheckboxSelected[rowData.checkbox].includes(tmpStr)){
                        // console.log("selected");
                        $(row).addClass("selected");
                    } 
                }
            },

            // Optimise the drawCallback later.
            drawCallback : function (settings) {

                // -------------------------------------------
                // -- Processing weight ----------------------
                // -------------------------------------------
                if($.fn.dataTable.isDataTable(`#childTableDT_${tableIndex}_${rowNum}`)){
                    tr = $(`#childTableDT_${tableIndex}_${rowNum}`).DataTable();
                    
                    tr.rows().indexes().map(
                    function(rowIndex) {

                        if(weightData[rowData.checkbox][tr.cell(rowIndex, 0).data()]) {
                            $($(`#childTableDT_${tableIndex}_${rowNum}
                            input[data-record-pos='${tr.cell(rowIndex, 0).data()}']
                            `)[0]).val(weightData[rowData.checkbox][tr.cell(rowIndex, 0).data()]);
                        }
                        else{
                            $($(`#childTableDT_${tableIndex}_${rowNum}
                            input[data-record-pos='${tr.cell(rowIndex, 0).data()}']
                            `)[0]).val(tr.cell(rowIndex, weightIndex).data());
                        }
                    }
                );}

                // -------------------------------------------
                // -------------------------------------------


                // ----------------------------------------------
                // -- Processing checkbox in subtable -----------
                // ----------------------------------------------
                tr.rows(`#childTableDT_${tableIndex}_${rowNum} .selected`).indexes().map(
                    function(rowIndex){
                        // console.log(tr.cell(rowIndex, checkboxIndex).data());
                        var selected = tr.cell(rowIndex, subCheckboxIndex).data().toString()
                        var index = subCheckboxSelected[rowData.checkbox].indexOf(selected);
                        if(index < 0){
                            subCheckboxSelected[rowData.checkbox].push(selected);
                        }
                        
                });

                // Remove the index from checkboxSelected if the checkbox is not checked
                tr.rows(`#childTableDT_${tableIndex}_${rowNum} :not(.selected)`).indexes().map( function(rowIndex) {
                    var notSelected = tr.cell(rowIndex, subCheckboxIndex).data().toString();
                    var index = subCheckboxSelected[rowData.checkbox].indexOf(notSelected);
                    if(index > -1){
                        subCheckboxSelected[rowData.checkbox].splice(index, 1);
                    }
                })
                // -------------------------------------------
                // -------------------------------------------

            }

        })
    }
}

window.onload = () => {

    // Load vue-select components
    Vue.component('v-select', VueSelect.VueSelect);


    _updateUserPanel = () => {
        // Set the variables before the
        // ajax is called.
        if(DTVue !== undefined){

            // console.log("Tab settings on users: ", DTVue.userData.userSettings.tab);
            
            // -----------------------------------------------
            // Set up sent variables
            // -----------------------------------------------
            tableTabFrameToBeActive = false;
            chartTabFrameToBeActive = false;
            tableActiveIndex = -1;
            chartActiveIndex = -1;
            DTVue.userData.userSettings.tab.map(function(arr, index) {
                // All active tab is set to false first.
                arr.activeTab = false;
                if(!arr.pin && arr.class === '.datatableMainClass') {
                    // arr.activeTab = true;
                    activeTabTableInfo = arr;
                    tableActiveIndex = index;
                }
                else if(!arr.pin && arr.class === '.chartMainClass') {
                    // arr.activeTab = true;
                    activeTabChartInfo = arr;
                    chartActiveIndex = index;
                }
            });
            
            // -----------------------------------------------
            // Get settings from datatable
            // -----------------------------------------------
            // console.log(tableActiveIndex, chartActiveIndex);
            if($.fn.dataTable.isDataTable(`#tableDT_${tableActiveIndex}`)){
                
                tr = $(`#tableDT_${tableActiveIndex}`).DataTable();
                
                tmp_arr = [];
                tr.columns().eq(0).each( function ( index ) {
                    var tmp = {}
                    var column = tr.column( index );
                    title = column.header();
                    // // console.log();
                    tmp[$(title).html()] = column.visible()
                    tmp_arr.push(tmp);
                } );

                // Empty the array in DTVue.
                while((DTVue.userData.userSettings.tab[tableActiveIndex].displayCols.length > 0))
                {DTVue.userData.userSettings.tab[tableActiveIndex].displayCols.pop()}
                
                // Insert the array into DTVue.
                tmp_arr.map(function(arr,idx) {
                    DTVue.userData.userSettings.tab[tableActiveIndex].displayCols.push(tmp_arr[idx]);
                });
                
                // console.log(DTVue.userData.userSettings.tab[tableActiveIndex]);
            }

            // ------------------------------------------------
            // Setting the values 
            // ------------------------------------------------
            // Updating table and/or chart data using HUD data.
            
            [tableActiveIndex, chartActiveIndex, dashboardIndex].forEach(function (arr_index) {
                if(DTVue.userData.userSettings.tab[arr_index] !== undefined){
                    Object.keys(DTVue.userData.userSettings.hud).map(
                        function(key) {
                            Vue.set(DTVue.userData.userSettings.tab[arr_index], key,
                            DTVue.userData.userSettings.hud[key]);
                        }
                    )
                    if(arr_index != 0){
                        Vue.set(DTVue.userData.userSettings.tab[arr_index],
                            'activeTab',
                             true);
                    }
                }
            });

            // ------------------------------------------
            // ---------- Write checkbox and weight information --
            // ------------------------------------------

            if($.fn.dataTable.isDataTable(`#tableDT_${tableActiveIndex}`)){
                
                var checkboxSelected = DTVue.userData.userSettings.tab[tableActiveIndex].checkboxSelected

                tr = $(`#tableDT_${tableActiveIndex}`).DataTable();
                
                

                // -------------------------------------------------
                // -- Get & remove selected rows -------------------
                // -------------------------------------------------
                console.log(tr.rows('.selected').indexes());
                // Put the index from checkboxSelected if the checkbox is checked
                tr.rows('.selected').indexes().map(
                    function(rowIndex){
                        // console.log(tr.cell(rowIndex, checkboxIndex).data());
                        var selected = tr.cell(rowIndex, 1).data().toString()
                        var index = checkboxSelected.indexOf(selected);
                        if(index < 0){
                            checkboxSelected.push(selected);
                        }
                        
                });

                
                // Remove the index from checkboxSelected if the checkbox is not checked
                tr.rows(':not(.selected)').indexes().map( 
                    function(rowIndex) {
                      var notSelected = tr.cell(rowIndex, 1).data().toString();
                        var index = checkboxSelected.indexOf(notSelected);
                        if(index > -1){
                            checkboxSelected.splice(index, 1);
                    }
                })

                // Save the info about the checkbox data of table:
                // console.log(checkboxSelected);
                Vue.set(DTVue.userData.userSettings.tab[tableActiveIndex], 'checkboxSelected',
                checkboxSelected);

                // -------------------------------------------------
                // -------------------------------------------------
                
                // After writing the selection, all checkboxes and weight data will be written in
                // user's settings
                tr.rows().indexes().map( function (rowNum){
                    if($.fn.dataTable.isDataTable(`#childTableDT_${tableActiveIndex}_${rowNum}`)){
                        
                        updateSubtableSettings(tableActiveIndex, rowNum);

                        
                    
                    }
                });
                // ---------------------------------------------
                // --------------------------------------------- 
                
            }

            // -------------------------------------------------
            // -------------------------------------------------

        }

        // -----------------------------------------------
        // Make an ajax call
        // -----------------------------------------------
        $.ajax({
            method: 'POST',
            url: `${pagePHPPath}`,
            contentType: "application/x-www-form-urlencoded",
            
            // Change the data before sending the data.
            data: DTVue === undefined ? 

            // if the Vue is not initialized: 
            {}:
            // if the Vue has already been initialized: 
            {
                _userSetting: DTVue.userData.userSettings
            },
            dataType: "json",
               success: function (jsonData) {

                var chartIndices = [];
                var tableIndices = [];
                console.log(jsonData);
                console.log(jsonData.userSettings.tab);
                jsonData.userSettings.tab.map(function (arr, index) {
                    switch(arr.class) {
                        case ".dashboardMainClass":{
                            dashboardIndex = index;
                            break;
                        }
                        case ".datatableMainClass":{
                            tableIndices.push(index);
                            break;
                        }
                        case ".chartMainClass":{
                            chartIndices.push(index);
                            break;
                        }
                    }
                });
                
                scoreRankdata = {};
                tableActiveIndex = 0;
                chartActiveIndex = 0;
                
                // Table to put
                console.log(jsonData.userSettings.tab.some(function(arr,index) {
                    tableActiveIndex = index;
                    // console.log(arr.activeTab);
                    return (arr.activeTab || arr.activeTab == 'true') && arr.class === '.datatableMainClass';
                }));

                // Chart to put
                console.log(jsonData.userSettings.tab.some(function(arr,index) {
                    chartActiveIndex = index;
                    // console.log(arr.activeTab);
                    return (arr.activeTab || arr.activeTab == 'true') && arr.class === '.chartMainClass';
                }));
                console.log(jsonData.dateTimeStartList);
                tableIndexTochange  = tableActiveIndex;
                // jsonData.userSettings.hud.classSelected = jsonData.classOptions[Object.keys(jsonData.classOptions)[0]].text;
                // console.log(jsonData.userSettings.tab[1].classSelected)
                [dashboardIndex, tableActiveIndex, chartActiveIndex].map(
                    function(i_arr) {
                        if(Object.keys(jsonData.classOptions).length == 0) {
                            
                            jsonData.userSettings.tab[i_arr].classSelected  = 'DEFAULT';
                            jsonData.userSettings.hud.classSelected = 'DEFAULT';
                        }
                        else if (
                            Object.keys(jsonData.classOptions).map(
                                function(arr) {return jsonData.classOptions[arr].text;}  
                            ).indexOf(jsonData.userSettings.hud.classSelected) < 0)
                        {
                            jsonData.userSettings.hud.classSelected = jsonData.classOptions[Object.keys(jsonData.classOptions)[0]].text;
                            jsonData.userSettings.tab[i_arr].classSelected = jsonData.classOptions[Object.keys(jsonData.classOptions)[0]].text;
                            // console.log(jsonData.userSettings.tab[i_arr].classSelected);
                        }
                        // console.log(Object.keys(jsonData.classOptions).map(
                        //     function(arr) {return jsonData.classOptions[arr].text;}  
                        // ));
                    }
                )

                // get Last indice as the last 
                // ---------------------------------------------
                // Create tab(s)
                // ---------------------------------------------
                if(DTVue === undefined) {

                    // Put all elements to docker first...
                    DTVue = new Vue({
                        el: "#page",
                        data: {
                            userData: {
                                ...jsonData,
                                "dashboardIndex": dashboardIndex,
                                "tableIndices": tableIndices,
                                "chartIndices": chartIndices
                            }
                        },
                        methods: {
                            updateUserPanel: function() {
                                _updateUserPanel();
                            }
                        }
                    });
                    
                    // Put time slider
                    const timeSlider = new TimeSlider({
                        container: "timeSlider",
                        mode: "time-window",
                        fullTimeExtent: {
                            start: new Date('2008-12-01'),
                            end: new Date('2030-11-30')
                        },
                        values:[ 
                            new Date(2011, 0, 1),
                            new Date(2013, 1, 1)
                        ],
                        stops: {
                            interval: {
                            value: 2,
                            unit: "days"
                            }
                        },
                        loop: true,
                        playRate: 300    
                    });

                    // // console.log(DTVue.userData.userSettings.hud.d3Path);
                    $('select').on('change',  function () {
                        // console.log("test");
                        _updateUserPanel();
                    })
                }

                else {

                    // Destroy and clear all tables before the start.
                    tableIndices.forEach( function(tableIndex) {
                        if($.fn.dataTable.isDataTable(`#tableDT_${tableIndex}`)){
                            tr = $(`#tableDT_${tableIndex}`).DataTable();
                            tr.clear();
                            tr.destroy();
                        }
                    });
                    
                    Vue.set(DTVue, 'userData', 
                            {
                                ...jsonData,
                                "dashboardIndex": dashboardIndex,
                                "tableIndices": tableIndices,
                                "chartIndices": chartIndices
                            }
                        );
                    // console.log(jsonData.classOptions);
                    Vue.set(DTVue.userData, 'classOptions', jsonData.classOptions);
                    // console.log(DTVue.userData.classOptions);
                }

                // --------------------------------------
                // ---- Create table
                // --------------------------------------
                if(jsonData.dashboardData.length > 0) {
                    // Put for indices tableIndices.
                    // jsonData.dashboardKeys;
                    tableIndices.forEach( function(tableIndex) {
                        
                        // weight data is used in 
                        // sub-table creation function
                        var buttonIndex;
                        var checkboxIndex;

                        // Get the stored data from user's settings. 
                        if(DTVue.userData.userSettings.tab[tableIndex].checkboxSelected){
                            checkboxSelected = 
                            DTVue.userData.userSettings.tab[tableIndex].checkboxSelected;
                        }
                        else {
                            checkboxSelected = [];
                        }

                        var weightData = {};

                        // Get  necessary keys from the beginning of the dashboard to create columns.
                        // All the columns on arrays are the same.
                        userColumnSettings = jsonData.userSettings.tab[tableIndex].displayCols.map(function (arr, index){
                            return Object.keys(arr).map(function(key) { return [key, arr[key], index];})
                        });
                        
                        console.log(userColumnSettings);

                        userHeading = userColumnSettings.map(
                            function(arr, index){
                                if(arr[0][0] == 'button'){
                                    buttonIndex = index;
                                }
                                else if(arr[0][0] == 'checkbox'){
                                    checkboxIndex = index;
                                }
                                return {
                                    title: arr[0][0],
                                    data: arr[0][0],
                                    visible: (arr[0][1] == "true"||arr[0][1] === true) ? true : false,
                                    searchable:(arr[0][1] == "true"||arr[0][1] === true) ? true : false, 
                                }
                            }
                        )
                        console.log(userHeading);

                        // console.log("User headings",userHeading);
                        columnButtons = jsonData.dashboardKeys.map(
                            function(arr, index){
                                return {
                                    extend: 'columnToggle',
                                    columns: index
                                }
                            }
                        )
                    

                    dashboardKeys = Object.keys(jsonData.dashboardData[0]).map(function (key) {return key;});                
                        
                    var table = $(`#tableDT_${tableIndex}`).DataTable({
                        dom: 'Blfrtip',
                        "processing": true,
                        "serverSide": true,
                        colReorder: true,
                        // select: true
                        //     style: "multi"
                        // }
                        // ,
                        paging: true,
                        buttons: columnButtons,
                        "ajax": {
                            // Send user's data using ajax call.
                            method: "POST",
                            url: "../php/datatable_pagination.php",
                            data: function (d){
                                // console.log(d);
                                // Store what checkbox is being checked.
                                var tmp_arr = [];
                                // console.log("content of checkbox in Vue", DTVue.userData.userSettings.tab[tableIndex].checkboxSelected);
                                
                                console.log("Getting data...");
                                // checkboxSelected = [];
                                if($.fn.dataTable.isDataTable(`#tableDT_${tableIndex}`)){
                                     
                                    tr = $(`#tableDT_${tableIndex}`).DataTable();
                                    // tr.columns().eq(0).each( function ( index ) {
                                    //     var tmp = {}
                                    //     var column = tr.column( index );
                                    //     title = column.header();
                                    //     // // console.log();
                                    //     tmp[$(title).html()] = column.visible()
                                    //     tmp_arr.push(tmp);
                                    // });

                                    // -------------------------------------------------
                                    // -- Get & remove selected rows -------------------
                                    // -------------------------------------------------

                                    // Put the index from checkboxSelected if the checkbox is checked
                                    tr.rows('.selected').indexes().map(
                                        function(rowIndex){
                                            // console.log(tr.cell(rowIndex, checkboxIndex).data());
                                            var selected = tr.cell(rowIndex, checkboxIndex).data().toString()
                                            var index = checkboxSelected.indexOf(selected);
                                            if(index < 0){
                                                checkboxSelected.push(selected);
                                            }
                                            
                                    });

                                    // Remove the index from checkboxSelected if the checkbox is not checked
                                    tr.rows(':not(.selected)').indexes().map( 
                                        function(rowIndex) {
                                          var notSelected = tr.cell(rowIndex, checkboxIndex).data().toString();
                                            var index = checkboxSelected.indexOf(notSelected);
                                            if(index > -1){
                                                checkboxSelected.splice(index, 1);
                                        }
                                    })

                                    // Save the info about the checkbox data of table:
                                    // console.log(checkboxSelected);
                                    Vue.set(DTVue.userData.userSettings.tab[tableIndex], 'checkboxSelected',
                                    checkboxSelected);

                                    // -------------------------------------------------
                                    // -------------------------------------------------
                                }
                                // console.log("After putting into the vue", 
                                // DTVue.userData.userSettings.tab[tableIndex]);

                                // console.log("After the calculation", checkboxSelected);
                                return $.extend({}, 
                                    d, 
                                    {userSetting: jsonData.userSettings.tab[tableIndex]},
                                    {visibilityData: tmp_arr},
                                    {checkboxSelected: checkboxSelected}
                                    ) 
                            }
                            ,
                            dataSrc: function(json) {
                                console.log(json);
                                
                                if(DTVue.userData.userSettings.tab[tableIndex].checkboxSelected){
                                    checkboxSelected = 
                                    DTVue.userData.userSettings.tab[tableIndex].checkboxSelected;
                                }
                                else {
                                    checkboxSelected = [];
                                }
                                console.log(DTVue.userData.userSettings.tab[tableIndex].checkboxSelected);
                                console.log("data received", checkboxSelected);
                                
                                // // console.log(json);
                                return json.data;
                            }
                        },
                        columns: userHeading,

                        // Put subtable under a new table.
                        'columnDefs': [
                            {
                                'targets': buttonIndex,
                                'searchable': false,        
                                'orderable': false,
                                'className':  'subtable_control'
                            },
                            {
                                'targets': checkboxIndex,
                                defaultContent: '',
                                orderable: false,
                                searchable: false,
                                className: 'select-checkbox',
                                createdCell:  function (td, cellData, rowData, row, col) {
                                    // This data will be stored after
                                    // // console.log("is checkbox saved", checkboxSelected);
                                    $(td)
                                    .addClass('main-table-checkbox')
                                    .attr('data-table-index', tableIndex)
                                    .attr('data-row-index', rowData.checkbox)
                                    // Put the call after drawing all of the contents of checkboxes.
                            
                                },
                                // title: `<input  type="checkbox" id="selectAll_${tableIndex}" onclick = "selectAll(this)">`
                                // 'render': function (data, type, row, meta){
                                'render': function (){
                                    // // console.log(row);
                                    // // console.log(meta.row);
                                    // return `<input type="checkbox" id="${tableIndex}_${row.checkbox}">`;
                                    return ``;
                                }
                        }],
                        "lengthMenu": [ [parseInt(jsonData.userSettings.tab[tableIndex].showRecs), 10, 25, 50, -1], 
                        [parseInt(jsonData.userSettings.tab[tableIndex].showRecs), 10, 25, 50, "Show All"]],
                        "rowCallback" : function (row, data){
                            if(checkboxSelected){
                                var tmpStr = String($($(row).find('.select-checkbox')[0]).attr('data-row-index'));
                                if(checkboxSelected.includes(tmpStr)){
                                    // console.log("selected");
                                    $(row).addClass("selected");
                                } 
                            }
                        },
                        // Optimise the drawCallback later...
                        drawCallback : function (settings) {
                            tr.rows('.selected').indexes().map(
                                function(rowIndex){
                                    // console.log(tr.cell(rowIndex, checkboxIndex).data());
                                    var selected = tr.cell(rowIndex, checkboxIndex).data().toString()
                                    var index = checkboxSelected.indexOf(selected);
                                    if(index < 0){
                                        checkboxSelected.push(selected);
                                    }
                                    
                            });

                            // Remove the index from checkboxSelected if the checkbox is not checked
                            tr.rows(':not(.selected)').indexes().map( function(rowIndex) {
                                var notSelected = tr.cell(rowIndex, checkboxIndex).data().toString();
                                var index = checkboxSelected.indexOf(notSelected);
                                if(index > -1){
                                    checkboxSelected.splice(index, 1);
                                }
                            })

                            $(`#tableDT_${tableIndex}`).on('click', "td.main-table-checkbox", function (e) {
                                e.stopImmediatePropagation();
                                // console.log();
                                // console.log($(this));
                                if($(this).closest('tr').hasClass('selected')){
                                    $(this).closest('tr').removeClass('selected');
                                }
                                else {
                                    $(this).closest('tr').addClass('selected');
                                }
                                _updateUserPanel();
                            });
                        }
                        
                        // When clicking on the table, then it shows a subtable.
                    });


                    // ------------------------------------------------------------
                    // ---- Create onclick event for storing the checkbox data when the checkbox is clicked ------------
                    // ------------------------------------------------------------
                    
                    // TODO: Think about how the below can work...
                    
                    // $(`#tableDT_${tableIndex}` ).on('click', ` tr[role="row"]`,function(event){
                    //     if($.fn.dataTable.isDataTable(`#tableDT_${tableIndex}`)){
                                        
                    //         tr = $(`#tableDT_${tableIndex}`).DataTable();
                    //         tr.rows('.selected').indexes().map(
                    //             function(rowIndex){
                    //                 // console.log(tr.cell(rowIndex, checkboxIndex).data());
                    //                 var selected = tr.cell(rowIndex, checkboxIndex).data().toString()
                    //                 var index = checkboxSelected.indexOf(selected);
                    //                 if(index < 0){
                    //                     checkboxSelected.push(selected);
                    //                 }
                                    
                    //         });

                    //         // Remove the index from checkboxSelected if the checkbox is not checked
                    //         tr.rows(':not(.selected)').indexes().map( function(rowIndex) {
                    //             var notSelected = tr.cell(rowIndex, checkboxIndex).data().toString();
                    //             var index = checkboxSelected.indexOf(notSelected);
                    //             if(index > -1){
                    //                 checkboxSelected.splice(index, 1);
                    //             }
                    //         })
                    //         // console.log(checkboxSelected);
                    //     }
                    // });
        

                    // ------------------------------------------------------------
                    // ------------------------------------------------------------


                    // ---------- Set action to the buttons ------------- //
                    // -------------------------------------------------- //
                    $(`#tableDT_${tableIndex} tbody`).
                        // off('click', function(){}).
                        on('click', 'td.subtable_control', function (e) {
                            
                            // Prevent the function from executing itself
                            // multiple times.
                            e.stopImmediatePropagation();
                            
                            var tr = $(this).closest('tr');
                            // // console.log("Initiate command.......")
                            var t2 = $(`#tableDT_${tableIndex}`).DataTable();
                            
                            var row = t2.row( t2.row(this).index() );
                            // console.log(row);
                            
                            // Get row number.
                            var rowNum = t2.row(this).index();
                            // // console.log(rowNum);
                            var rowData = t2.row(this).data();
                            
                            createSubTable(tableIndex,tr,row,rowNum,rowData, weightData);
                        });
                    
                        table.page( jsonData.userSettings.tab[tableIndex].lastPage - 1 ).draw( 'page' );
                        // console.log( jsonData );
                    });
                    // --------------------------------------
                    // ---- Create chart 
                    // --------------------------------------
                 
                    chartIndices.forEach(function(chartIndex) {
                       
                        // // console.log(jsonData.userSettings.tab[chartIndex]);
                        if(
                            // chartIndex == chartActiveIndex
                            !DTVue.userData.userSettings.tab[chartIndex].pin
                            ){
                            $.ajax({
                                method: 'POST',
                                url: `${chartPHPPath}`,
                                contentType: "application/x-www-form-urlencoded",
                                // Change the data before sending the data.
                                data: {
                                    userSetting: DTVue.userData.userSettings.tab[chartIndex],
                                    checkboxSelected: DTVue.userData.userSettings.tab[tableActiveIndex].checkboxSelected
                                },
                                dataType: "json",
                                success: function (jsonData) {
                                    scoreData = {};
                                    console.log("graph data", jsonData);
                                    // Only a part of the score data is retrieved.
                                    jsonData.scores.forEach(function(arr){
                                        scoreData[arr.legend_id] = arr.total_score;
                                    })
                                    // console.log(scoreData);
                                    createChart(scoreData,
                                        {chartSelected: DTVue.userData.userSettings.tab[chartIndex].chartType,
                                        labelSelected:  DTVue.userData.userSettings.tab[chartIndex].labelType,
                                        legendSelected: DTVue.userData.userSettings.tab[chartIndex].legendType},
                                    chartIndex);
    
                                    // // console.log($('#d3ImageLoc_'+chartIndex).html());
    
                                    DTVue.userData.userSettings.tab[chartIndex].chartDOM = 
                                    $('#d3ImageLoc_'+chartIndex).html();
                                }
                            });
                        }

                        else {

                            $('#d3ImageLoc_'+chartIndex).html(DTVue.userData.userSettings.tab[chartIndex].chartDOM);

                        }
                        
                    });

                    // --------------------------------------
                    // ---- Create tree
                    // --------------------------------------

                    treeData = jsonData.dashboardTreeData.map(JSON.parse);

                    if(Array.isArray(DTVue.userData.userSettings.hud.d3Path)){
                        treeData.map(function(arr) {
                            if(DTVue.userData.userSettings.hud.d3Path.indexOf(
                                arr['li_attr']['data-entity-id']) > -1
                            )
                            {
                                arr['state'] = {}
                                arr['state']['opened'] = true;
                                arr['state']['disabled'] = false;
                                arr['state']['selected'] = false;
                                return arr;
                            }
                            else
                            {
                                arr['state'] = {}
                                arr['state']['opened'] = false;
                                arr['state']['disabled'] = false;
                                arr['state']['selected'] = false;
                                return arr;
                            }
                        
                        })
                    }
                    
                    // // console.log(treeData);

                    if($('#dashboardTree').hasClass('jstree')) {
                        $('#dashboardTree').empty().jstree("destroy");

                        $('#dashboardTree').jstree({
                            'core' : {
                                'data' : treeData
                            }
                        });
                        
                    }
                    else {
                        // treePath = DTVue.userData.userSettings.hud.d3Path;
                        
                        $('#dashboardTree').jstree({
                            'core' : {
                                'data' : treeData
                            }
                        });

                        // Set action for tree.
                        $('#dashboardTree').on('click', '.jstree-anchor', function (e) {
                          $(this).jstree(true).toggle_node(e.target);
                        }).jstree()
                    }
                    // // console.log($('#dashboardTree').find(`[data-entity-id='ETH']`).attr('id')); 
                    // Generate main table.
                    $('#dashboardTree').on("changed.jstree", function (e, data) { 

                        var tmp = data.instance.get_node(data.node.id);
                        // console.log("tmpData", tmp);

                        // Write the level
                        if(tmp.state.opened){
                            DTVue.userData.userSettings.hud.levelId = tmp.li_attr['data-level-id'];
                        }
                        else{
                            if(tmp.li_attr['data-level-id']< 7){
                                DTVue.userData.userSettings.hud.levelId = parseInt(tmp.li_attr['data-level-id']) + 1;
                            }
                        }


                        DTVue.userData.userSettings.hud.d3Path =  getEntityIdsFromTree(data);
                        _updateUserPanel();
                    });
                } 
            }
        });
    }

    // Run this function when the user
    // has logged in.
    _updateUserPanel();
    
}



// End of require module load;
});
