Meteor.defer(function () {
    //---Open Inventory type block "FIFO Inventory"---
    var locationTransferTotalCost = 0;
    var locationTransferDetails = Pos.Collection.LocationTransferDetails.find({locationTransferId: locationTransferId});
    var prefix = branchId + "-";
    locationTransferDetails.forEach(function (ltd) {
            var transaction = [];
            var inventories = Pos.Collection.FIFOInventory.find({
                branchId: branchId,
                productId: ltd.productId,
                locationId: ltd.locationId,
                isSale: false
            }, {sort: {_id: 1}}).fetch();
            var enoughQuantity = ltd.quantity;
            for (var i = 0; i < inventories.length; i++) {
                //or if(enoughQuantity==0){ return false; //to stop the loop.}
                var inventorySet = {};
                var remainQty = (inventories[i].remainQty - ltd.quantity);
                var quantityOfThisPrice = 0;
                if (remainQty <= 0) {
                    inventorySet.remainQty = 0;
                    inventorySet.isSale = true;
                    if ((inventories[i].remainQty - inventories[i].quantity) >= 0) {
                        quantityOfThisPrice = inventories[i].quantity - 0;
                    } else {
                        quantityOfThisPrice = inventories[i].remainQty - 0;
                    }
                }
                else {
                    inventorySet.remainQty = remainQty;
                    inventorySet.isSale = false;
                    if ((inventories[i].remainQty - inventories[i].quantity) >= 0) {
                        quantityOfThisPrice = inventories[i].quantity - remainQty;
                    } else {
                        quantityOfThisPrice = inventories[i].remainQty - ltd.quantity;
                    }
                }
                if (enoughQuantity != 0) {
                    if (quantityOfThisPrice > 0) {
                        transaction.push({quantity: quantityOfThisPrice, price: inventories[i].price})
                    }
                }
                enoughQuantity -= quantityOfThisPrice;
                if (i == inventories.length - 1) {
                    inventorySet.imei = subtractImeiArray(inventories[i].imei, ltd.imei);
                }
                Pos.Collection.FIFOInventory.update(inventories[i]._id, {$set: inventorySet});
                // var quantityOfThisPrice = inventories[i].quantity - remainQty;
            }
            var setObj = {};
            setObj.transaction = transaction;
            setObj.totalCost = 0;
            if (transaction.count() > 0) {
                transaction.forEach(function (t) {
                    setObj.totalCost += parseFloat(t.price) * parseFloat(t.quantity);
                });
            }
            locationTransferTotalCost += setObj.totalCost;
            Pos.Collection.LocationTransferDetails.direct.update(
                ltd._id,
                {$set: setObj}
            );
            //inventories=sortArrayByKey()
        }
    );
    //--- End Inventory type block "FIFO Inventory"---
});