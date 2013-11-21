Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout:{
        type:'vbox',
        align:'stretch'
    },
    items:[

        { // define a container to house header info about the PI
            xtype:'container',
            itemId:'appHeaderContainer',
            padding:'15 15 15 15' // top ? bottom left,
        },

        { // define a container to house the grid of features
            xtype:'container',
            itemId:'featureGridContainer',
            padding:'15 15 15 15' // top ? bottom left,
        }
    ],


    // --- App global variables ---

    gTagName: undefined,        // Tag name selected

    // --- end global variables ---


    launch: function() {
        //Write app code here
        console.log("App in Running!!!")

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

                    this._processTaggedFeatures(records);

                },
                scope:this
            }
        }); // end query for Tagged Features


        console.log("E ==> _selectTaggedFeatures()" + "\n");

    }, // end _selectTaggedFeatures()

    _processTaggedFeatures: function(theTaggedFeatures) {

        console.log("B ==> _processTaggedFeatures()");


        // ----- BEGIN: grab the PI's fields
        var nbrFeatures;

        nbrFeatures = theTaggedFeatures.length;
        console.log("nbrFeatures: " + nbrFeatures + "\n");

        // loop through each feature
        for (var ndx = 0; ndx < nbrFeatures; ndx++) {

            aFeature = theTaggedFeatures[ndx];

            if (aFeature != null) {

                var aFeatureName = aFeature.get("Name");
                console.log("aFeatureName: " + aFeatureName);

                var aProjectName = aFeature.get("Project")["Name"];
                console.log("aProjectName: " + aProjectName + "\n");

                // capture the Project name
                aFeature["ProjectName"] = aProjectName;

                var testName = aFeature.get("ProjectName");
                console.log("testName: " + testName);

            } // end test if valid feature

        } // end loop through each feature


        // throw the tagged features into a grid
        this._gridTaggedFeatures(theTaggedFeatures);


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
                {
                    text: 'ObjectID',
                    dataIndex: 'ObjectID'
                },
                {
                    text: 'Name',
                    dataIndex: 'Name'
                },
                {
                    text: 'ProjectName',
                    dataIndex: 'ProjectName'
                },
                {
                    text: 'FormattedID',
                    dataIndex: 'FormattedID'
                }
            ]//,
            //height:400
        });

        var gridHolder = this.down('#featureGridContainer');
        gridHolder.removeAll(true);
        gridHolder.add(featureGrid);


        console.log("E ==> _gridTaggedFeatures()" + "\n");

    } // end gridTaggedFeatures()

});
