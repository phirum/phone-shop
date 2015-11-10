Meteor.methods({
    posStockReport: function (arg) {
        var data = {
            title: {},
            header: {},
            content: [{index: 'No Result'}],
            footer: {}
        };
        var params = {};
        // var date=new Date(this.date);
        var date = moment(arg.date + " 23:59:59").toDate();
        var branchId = arg.branch;
        if (date != null) params.createdAt = {$lte: date};
        if (branchId != null && branchId != null) params.branchId = branchId;
        data.title = Cpanel.Collection.Company.findOne();
        var header = {};
        header.branch = Cpanel.Collection.Branch.findOne(branchId).enName;
        header.date = arg.date;

        data.header = header;
        var stockArray = [];
        var i = 1;
        var products = Pos.Collection.Products.find();
        var content = [];
        products.forEach(function (p) {
            var item = {};
            var inventory = Pos.Collection.FIFOInventory.findOne({
                branchId: branchId,
                productId: p._id,
                createdAt: {$lte: date}
            }, {sort: {createdAt: -1, _id: -1}});
            if (inventory != null) {
                item = inventory;
                item.productName = inventory._product.name + ' (' + inventory._product._unit.name + ')';
                item.branchName = inventory._branch.enName;
            } else {
                item.productName = p.name + ' (' + p._unit.name + ')';
                item.branchName = Cpanel.Collection.Branch.findOne(branchId).enName;
                item.remainQty = 0;
                item.price = p.purchasePrice;
            }
            item.order = i;
            i++;
            content.push(item);
        });

        /*     var stockHistories = Pos.Collection.StockHistories.findOne(params, {sort: {createdAt: -1}});
         if (stockHistories != null) {
         var branchName = Cpanel.Collection.Branch.findOne(stockHistories.branchId).enName;
         stockHistories.stockList.forEach(function (stockObj) {
         var product = Pos.Collection.Products.findOne(stockObj.productId);
         stockObj.order = i;
         i++;
         stockObj.productName = product.name;
         stockObj.barcode = product.barcode;
         stockObj.purchasePrice = product.purchasePrice;
         stockObj.branchName = branchName;
         stockArray.push(stockObj);
         });
         }
         var content = stockArray;*/
        if (content.length > 0) {
            data.content = content;
        }
        return data;
    }
});
