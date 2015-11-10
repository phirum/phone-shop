Pos.Collection.PurchaseDetails.before.insert(function (user, doc) {
    doc._id = idGenerator.genWithPrefix(Pos.Collection.PurchaseDetails, doc.purchaseId, 3);
});
Pos.Collection.PurchaseDetails.after.remove(function (userId, doc) {
    var purchase = Pos.Collection.Purchases.findOne(doc.purchaseId);
    if (purchase != null) {
        updatePurchaseTotal(doc.purchaseId);
    }
});
Pos.Collection.Purchases.after.update(function (userId, doc, fieldNames, modifier, options) {
    updatePurchaseTotal(doc._id);
});

Pos.Collection.PurchaseDetails.after.insert(function (userId, doc) {
    updatePurchaseTotal(doc.purchaseId);

});

Pos.Collection.PurchaseDetails.after.update(function (userId, doc, fieldNames, modifier, options) {
    updatePurchaseTotal(doc.purchaseId);
});

Pos.Collection.Purchases.after.remove(function (userId, doc) {
    Pos.Collection.PurchaseDetails.remove({purchaseId: doc._id});
    //Pos.Collection.PurchaseDetails.direct.remove({purchaseId: doc._id});
});

function updatePurchaseTotal(purchaseId) {
    //var discount = Pos.Collection.Purchases.findOne(purchaseId).discountAmount;
    var discount = Pos.Collection.Purchases.findOne(purchaseId).discount;
    var purchaseSubTotal = 0;
    var purchaseDetails = Pos.Collection.PurchaseDetails.find({purchaseId: purchaseId});
    purchaseDetails.forEach(function (purchaseDetail) {
        purchaseSubTotal += parseFloat(purchaseDetail.amount);
    });
    var baseCurrencyId = Cpanel.Collection.Setting.findOne().baseCurrency;
    //var total = purchaseSubTotal - discount;
    var total = purchaseSubTotal * (1 - discount / 100);
    if (baseCurrencyId == "KHR") {
        total = roundRielCurrency(total);
    }
    var set = {};
    set.subTotal = purchaseSubTotal;
    set.total = total;
    set.owedAmount = total;
    //set.discountAmount=purchaseSubTotal-total;
    Pos.Collection.Purchases.direct.update(purchaseId, {$set: set});
    //Meteor.call('updatePurchase', purchaseId, set);
}
