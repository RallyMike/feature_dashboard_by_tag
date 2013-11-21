Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout:{
        type:'vbox',
        align:'stretch'
    },
    items:[

        { // define a container to house header info about the PI
            xtype: 'container',
            itemId: 'appHeaderContainer',
            padding: '15 15 15 15' // top ? bottom left,
        },

        { // define a container to house the grid of features
            xtype: 'container',
            itemId: 'featureGridContainer',
            padding: '15 15 15 15' // top ? bottom left,
        },

        { // define a container to house the CFD diagram
            xtype: 'container',
            itemId: 'cfdContainer',
            padding: '15 15 15 15' // top ? bottom left,
        }
    ],


    // --- App global variables ---

    gSkipTagPicker: true,       // Use hard-coded tag or select from picker
    gTagName: undefined,        // Tag name selected

    gFeatureObjectIDArr: [],    // Array of the object ID's of the features selected

    aCalc: undefined,

    // --- end global variables ---


    launch: function() {
        //Write app code here
        console.log("App in Running!!!");


        if (this.gSkipTagPicker === false)
        {
            // grab app header container
            var aContainer = this.down('#appHeaderContainer');


            aTagPicker = Ext.create('Rally.ui.picker.MultiObjectPicker', {
                modelType: 'tag',
                //autoExpand: true, // NOTE: this config is all jacked up
                fieldLabel: "Pick your Tag Yo",
                listeners:{
                    select:function (theTagPicker, theSelectedValue) {
                        this.gTagName = theSelectedValue.get('Name');

                        console.log("this.gTagName: " + this.gTagName);

                        this._selectTaggedFeatures();
                    },
                    scope:this
                }

            });

            aContainer.add(aTagPicker);

        }

        else // hard-code it!
        {
            this.gTagName = "Customer B";
            this._selectTaggedFeatures();
        }

    }, // end launch()

    _selectTaggedFeatures: function() {

        console.log("B ==> _selectTaggedFeatures()");

        console.log("this.gTagName: " + this.gTagName);

        var store = Ext.create('Rally.data.WsapiDataStore', {
            model: 'PortfolioItem/Feature',
            fetch: ["ObjectID", "Name", "ActualStartDate", "Project", "FormattedID",
                    "ActualEndDate", "PlannedStartDate", "PlannedEndDate",
                    "LeafStoryCount", "LeafStoryPlanEstimateTotal", "AcceptedLeafStoryCount", "AcceptedLeafStoryPlanEstimateTotal",
                    "PercentDoneByStoryCount", "PercentDoneByStoryPlanEstimate"],

            // scope globally (for now)
//            context: {
//                project:null
//            },
            context: {
                project: '/project/11377984352', // M^2 Enterprises
                projectScopeUp: false,
                projectScopeDown: true
            },

            filters: [
                {
                    property: 'Tags.Name',
                    operator: 'contains',
                    value: this.gTagName
                }
            ],

            limit: Infinity,
            autoLoad: true,

            listeners: {
                load:function (store, records, success) {

                    console.log("Loading freaking data baby");

                    this._tableOfContents(records);

                },
                scope:this
            }
        }); // end query for Tagged Features


        console.log("E ==> _selectTaggedFeatures()" + "\n");

    }, // end _selectTaggedFeatures()

    _tableOfContents: function(theTaggedFeatures) {

        console.log("B ==> _tableOfContents()" + "\n");


        // ----- Primary function used to drive the rest of the App -----

        this._processTaggedFeatures(theTaggedFeatures); // process the tagged features

        this._gridTaggedFeatures(theTaggedFeatures); // throw the tagged features into a grid

        this._driveCFD(); // drive the CFD chart for the tagged features


        console.log("E ==> _tableOfContents()" + "\n");

    }, // end _tableOfContents()

    _processTaggedFeatures: function(theTaggedFeatures) {

        console.log("B ==> _processTaggedFeatures()");


        // ----- BEGIN: grab the PI's fields
        var nbrFeatures;

        nbrFeatures = theTaggedFeatures.length;
        console.log("nbrFeatures: " + nbrFeatures + "\n");

        // loop through each feature
        var that = this;

        Ext.each(theTaggedFeatures, function(aFeature){

            if (aFeature !== null) {

                var aFeatureObjectID = aFeature.get("ObjectID");
                var aFeatureName = aFeature.get("Name");
                var aProjectName = aFeature.get("Project").Name;

                console.log("aFeatureObjectID: " + aFeatureObjectID);
                console.log("aFeatureName: " + aFeatureName);
                console.log("aProjectName: " + aProjectName);
                //debugger;

                // retain the Project name directly in the record
                aFeature.set("ProjectName", aProjectName);
                console.log('aFeature.get("ProjectName"): ' + aFeature.get("ProjectName") + "\n");

                var anObjectID = new Object(aFeatureObjectID);
                console.log("anObjectID: " + anObjectID);

                var len = that.gFeatureObjectIDArr.length;
                console.log("len: " + len);


                that.gFeatureObjectIDArr.push(anObjectID);
                console.log(that.gFeatureObjectIDArr);

            } // end test if valid feature

        }); // end loop through each feature


        console.log("E ==> _processTaggedFeatures()" + "\n");

    }, // end _processTaggedFeatures()

    _gridTaggedFeatures: function(theTaggedFeatures) {

        console.log("B ==> _gridTaggedFeatures()");


        var featureStore = Ext.create('Rally.data.custom.Store', {
            data: theTaggedFeatures
        });




        var featureGrid = Ext.create('Rally.ui.grid.Grid', {
            title: 'Tagged Features',
            store: featureStore,

            columnCfgs: [
                {text: 'ObjectID',              dataIndex: 'ObjectID',                      flex: 1},
                {text: 'FormattedID',           dataIndex: 'FormattedID',                   flex: 1},
                {text: 'Name',                  dataIndex: 'Name',                          flex: 2},
                {text: 'Project',               dataIndex: 'ProjectName',                   flex: 1},
                {text: 'Leaf Stories (Count)',  dataIndex: 'LeafStoryCount',                flex: 1},
                {text: 'Leaf Stories (Size)',   dataIndex: 'LeafStoryPlanEstimateTotal',    flex: 3}
            ]//,
            //height:400
        });

        var gridHolder = this.down('#featureGridContainer');
        gridHolder.removeAll(true);
        gridHolder.add(featureGrid);


        console.log("E ==> _gridTaggedFeatures()" + "\n");

    }, // end gridTaggedFeatures()


    // ----------------------------------------------------
    // ----------------------------------------------------
    // ----- Call the CFD prototype code that I found
    // ----------------------------------------------------
    // ----------------------------------------------------
    _driveCFD: function() {

        console.log("B ==> _driveCFD()");


        var TIME_PERIOD_IN_MONTHS = 2,
            TIME_PERIOD_IN_MILLIS = 1000 * 60 * 60 * 24 * 30 * TIME_PERIOD_IN_MONTHS;


        this.aCalc = Ext.define("ProjectCFDCalculator", {
            extend: "Rally.data.lookback.calculator.TimeSeriesCalculator",
            values: ["Idea","Defined","In-Progress","Completed","Accepted","Released"],

            getDerivedFieldsOnInput : function () {
                var dfs = [];
                var fieldName = 'ScheduleState';
                var that = this;
                _.each(that.values,function(value) {

                    var s = "return snapshot['"+fieldName+"'] == '" + value + "' ? 1 : 0;";

                    var fn = new Function("snapshot",s);
                    dfs.push({
                        as : value,
                        f : fn
                    });
                });
                return dfs;
            }
            ,
            getMetrics: function() {
                var metrics = [];
                var that = this;
                _.each(that.values,function(value) {
                    metrics.push({
                        field : value,
                        as : value,
                        f : "sum",
                        display : "area"
                    });
                });
                console.log(metrics);
                return metrics;
            }
        }); // end define the calculator




        // --- drive the CFD stuff ---

        var today = new Date();
        var timePeriod = new Date(today - TIME_PERIOD_IN_MILLIS);


        // ----- Hard-code in M^2 Enterprises -----
        //this.chartConfig.storeConfig.find['_ProjectHierarchy'] = this.getContext().getProject().ObjectID;
        //this.chartConfig.storeConfig.find['Project'] = {"$exists":true};
        this.chartConfig.storeConfig.find['_ProjectHierarchy'] = 11377984352;
        this.chartConfig.storeConfig.find['Project'] = {"$exists":true};


        this.chartConfig.storeConfig.find['_ValidFrom'] = {
            "$gt": timePeriod.toISOString()
        };
        this.chartConfig.chartConfig.title = {
            text: this.getContext().getProject().Name + " Cumulative Flow Diagram"
        };


        // experiment with how we add the CFD to the page
        //this.add(this.chartConfig);

        var cfdHolder = this.down('#cfdContainer');
        cfdHolder.removeAll(true);
        cfdHolder.add(this.chartConfig);



        console.log("B ==> _driveCFD()");

    }, // end _driveCFD()


    chartConfig: {
        xtype: 'rallychart',

        storeConfig: {
            find : {
                '_TypeHierarchy': { '$in' : ['HierarchicalRequirement','Defect']},
                'Children': null
            },
            fetch: ['ScheduleState', 'PlanEstimate'],
            hydrate: ["ScheduleState"]
        },

        calculatorType: 'ProjectCFDCalculator',
        calculatorConfig: {
        },

        chartConfig: {
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: 'Cumulative Flow Diagram'
            },
            xAxis: {
                tickmarkPlacement: 'on',
                tickInterval: 20,
                title: {
                    text: 'Days'
                }
            },
            yAxis: [
                {
                    title: {
                        text: 'Count'
                    }
                }
            ],
            plotOptions: {
                series: {
                    marker: {
                        enabled: true
                    }
                },
                area: {
                    stacking: 'normal'
                }
            }
        } // end chartConfig (inner)
    } // end chartConfig (outer)

});
