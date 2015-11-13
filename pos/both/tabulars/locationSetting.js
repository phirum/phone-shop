Pos.TabularTable.LocationSettings = new Tabular.Table({
    name: "posLocationSettingList",
    collection: Pos.Collection.LocationSettings,
    columns: [
        {
            title: '<i class="fa fa-bars"></i>',
            tmpl: Meteor.isClient && Template.pos_locationSettingAction
        },
        {data: "_id", title: "ID"},
        {data: "location._name", title: "Location"}

    ],
    order: [['1', 'desc']],
    columnDefs: [
        {"width": "12px", "targets": 0}
    ]
});
