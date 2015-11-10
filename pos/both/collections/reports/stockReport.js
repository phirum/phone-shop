/**
 * Schema
 */
Pos.Schema.StockReport = new SimpleSchema({
    date: {
        type: String,
        label: "Date"
    },
    branch:{
        type:String,
        label:"Branch",
        autoform: {
            type: "select2",
            options:function(){
                return Cpanel.List.branchForUser();
            }
        }
    }
    //quantity:{
    //    type:Number,
    //    label:"Quantity Less Than This"
    //}
});