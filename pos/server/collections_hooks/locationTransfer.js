Pos.Collection.LocationTransferDetails.before.insert(function (user, doc) {
    doc._id = idGenerator.genWithPrefix(Pos.Collection.LocationTransferDetails, doc.locationTransferId, 3);
});
Pos.Collection.LocationTransfers.after.remove(function (userId, doc) {
    Pos.Collection.LocationTransferDetails.remove({locationTransferId: doc._id});
    //Pos.Collection.SaleDetails.direct.remove({saleId: doc._id});
});
