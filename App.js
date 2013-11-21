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

    gSkipTagPicker: true,       // Use hard-coded tag or select from picker
    gTagName: undefined,        // Tag name selected

    gFeatureObjectIDArr: [],    // Array of the object ID's of the features selected

    // --- end global variables ---


    launch: function() {
        //Write app code here
        console.log("App in Running!!!")


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

            if (aFeature != null) {

                var aFeatureObjectID = aFeature.get("ObjectID");
                var aFeatureName = aFeature.get("Name");
                var aProjectName = aFeature.get("Project")["Name"];

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

    } // end gridTaggedFeatures()

});
