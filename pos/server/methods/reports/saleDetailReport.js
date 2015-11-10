Meteor.methods({
    posSaleDetailReport: function (arg) {
        var data = {
            title: {},
            header: {},
            content: [{index: 'No Result'}],
            footer: {}
        };
        var params = {};
        var date = arg.date.split(" To ");
        var fromDate = moment(date[0] + " 00:00:00").toDate();
        var toDate = moment(date[1] + " 23:59:59").toDate();
        var customerId = arg.customerId;
        var staffId = arg.staffId;
        var branchId = arg.branch;
        var branchIds = [];
        if (branchId == "" || branchId == null) {
            //var userId = Meteor.userId();
            var userId = this.userId;
            branchIds = Meteor.users.findOne(userId).rolesBranch;
        } else {
            branchIds.push(branchId);
        }
        /****** Title *****/
        data.title = Cpanel.Collection.Company.findOne();

        if (fromDate != null && toDate != null) params.saleDate = {$gte: fromDate, $lte: toDate};
        if (customerId != null && customerId != "") params.customerId = customerId;
        if (staffId != null && staffId != "") params.staffId = staffId;
        params.branchId = {$in: branchIds};
        params.status = {$ne:"Unsaved"};
        params.transactionType="Sale";

        var header = {};
        var branchNames = "";
        branchIds.forEach(function (id) {
            branchNames += Cpanel.Collection.Branch.findOne(id).enName + ", ";
        });

        header.branch = branchNames.substr(0, branchNames.length - 2);
        header.date = arg.date;
        var staff = "All", customer = "All";
        if (customerId != null && customerId != "")
            customer = Pos.Collection.Customers.findOne(customerId).name;
        if (staffId != null && staffId != "")
            staff = Pos.Collection.Staffs.findOne(staffId).name;
        header.staff = staff;
        header.customer = customer;

        /****** Header *****/
        data.header = header;
        var content = getSaleProducts(params);
        data.grandTotal=content.grandTotal;
        data.grandTotalCost=content.grandTotalCost;
        //return reportHelper;
        /****** Content *****/
        if (content.length > 0) {
            data.content = content;
        }
        return data
    }
});



function getSaleProducts(params) {
    var saleIds = Pos.Collection.Sales.find(params, {fields: {_id: 1}}).map(function (sale) {
        return sale._id;
    });
    var result = [];
    var saleDetails = Pos.Collection.SaleDetails.find(
        {saleId: {$in: saleIds}},
        {fields: {productId: 1, quantity: 1, price: 1, amount: 1,totalCost:1}});
    (saleDetails.fetch()).reduce(function (res, value) {
        if (!res[value.productId]) {
            res[value.productId] = {
                totalCost:value.totalCost,
                amount: value.amount,
                quantity: 0,
                productId: value.productId
            };
            result.push(res[value.productId])
        } else {
            res[value.productId].amount += value.amount;
            res[value.productId].totalCost+=value.totalCost;
        }
        res[value.productId].quantity += value.quantity;
        return res;
    }, {});
    var i = 1;
    var arr = [];
    var granTotalCost=0;
    var grandTotal = 0;
    result.forEach(function (r) {
        var product = Pos.Collection.Products.findOne(r.productId);
        grandTotal += r.amount;
        granTotalCost+= r.totalCost;
        console.log(r.amount);
        var unit = Pos.Collection.Units.findOne(product.unitId).name;
        arr.push({
            order: i,
            productId: r.productId,
            productName: product.name + "(" + unit + ")",
            // price: numeral(r.price).format('0,0.00'),
            quantity: r.quantity,
            total: numeral(r.amount).format('0,0.00'),
            totalCost:numeral(r.totalCost).format('0,0.00')
        });
        i++;
    });
    arr.grandTotal = numeral(grandTotal).format('0,0.00');
    arr.grandTotalCost=numeral(granTotalCost).format('0,0.00');
    return arr;
}




