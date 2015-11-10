Session.setDefault('isRetail', true);
Session.setDefault('hasUpdate', false);
Template.pos_locationTransfer.onRendered(function () {
    createNewAlertify(["customer", "userStaff"]);
    Session.set('isRetail', true);
    $('#locationTransfer-date').datetimepicker({
        format: "MM/DD/YYYY hh:mm:ss A"
    });
    //$('#product-id').select2();
    $('#product-barcode').focus();
    setTimeout(function () {
        $('.select-two').select2();
        var s = Pos.Collection.LocationTransfers.findOne({
            _id: FlowRouter.getParam('locationTransferId'),
            status: "Unsaved",
            branchId: Session.get('currentBranch')
        });
        if (s == null) {
            FlowRouter.go('pos.locationTransfer');
            $('#product-barcode').focus();
        }
    }, 500);
});
Template.pos_locationTransfer.helpers({
    transactionType: function () {
        return [
            {value: 'LocationTransfer', name: 'LocationTransfer'},
            {value: 'AdjustmentQtyDown', name: 'AdjustmentQtyDown'}
        ]
    },
    imeis: function () {
        var locationTransferDetailId = Session.get('locationTransferDetailId');
        if (locationTransferDetailId != null) {
            var sd = Pos.Collection.LocationTransferDetails.findOne(locationTransferDetailId);
            return (sd == null || sd.imei == null) ? [] : sd.imei;
        } else {
            return [];
        }
    },
    hasUpdate: function () {
        var hasUpdate = Session.get('hasUpdate');
        if (hasUpdate != null && hasUpdate != "null") {
            return hasUpdate;
        }
        return false;
    },
    locationTransferDate: function () {
        var locationTransfer = Pos.Collection.LocationTransfers.findOne(FlowRouter.getParam('locationTransferId'));
        if (locationTransfer == null) {
            //return "";
            return moment(TimeSync.serverTime(null)).format('MM/DD/YYYY hh:mm:ss A');
        } else {
            return moment(locationTransfer.locationTransferDate).format('MM/DD/YYYY hh:mm:ss A');
        }
    },
    isRetailHelper: function () {
        var isRetail = true;
        var locationTransfer = Pos.Collection.LocationTransfers.findOne(FlowRouter.getParam('locationTransferId'));
        if (locationTransfer != null) {
            isRetail = locationTransfer.isRetail;
        }
        return isRetail == true;
    },
    getFileOfCurrency: function (id, field) {
        var currency = Cpanel.Collection.Currency.findOne(id);
        return currency[field];
    },
    hasTotal: function (total) {
        return total != null;
    },
    multiply: function (val1, val2, id) {
        var value = (val1 * val2);
        if (id != null && id == "KHR") {
            value = roundRielCurrency(value);
            return numeral(value).format('0,0.00');
        }
        return numeral(value).format('0,0.00');
    },
    currencies: function () {
        var id = Cpanel.Collection.Setting.findOne().baseCurrency;
        return Cpanel.Collection.Currency.find({_id: {$ne: id}});
    },
    baseCurrency: function () {
        var id = Cpanel.Collection.Setting.findOne().baseCurrency;
        return Cpanel.Collection.Currency.findOne(id);
    },
    exchangeRates: function () {
        var locationTransfer = Pos.Collection.LocationTransfers.findOne(FlowRouter.getParam('locationTransferId'));
        if (locationTransfer != null) {
            return Pos.Collection.ExchangeRates.findOne(locationTransfer.exchangeRateId);
        } else {
            var id = Cpanel.Collection.Setting.findOne().baseCurrency;
            return Pos.Collection.ExchangeRates.findOne({
                base: id,
                branchId: Session.get('currentBranch')
            }, {sort: {_id: -1, createdAt: -1}});
        }

    },
    compareTwoValue: function (val1, val2) {
        return val1 == val2;
    },
    locationTransfer: function () {
        var s = Pos.Collection.LocationTransfers.findOne(FlowRouter.getParam('locationTransferId'));
        s.locationTransferDate = moment(s.locationTransferDate).format("DD-MM-YY, hh:mm:ss a");
        s.subTotalFormatted = numeral(s.subTotal).format('0,0.00');
        s.totalFormatted = numeral(s.total).format('0,0.00');
        return s;
    },
    locationTransferDetails: function () {
        var locationTransferDetailItems = [];
        var sD = Pos.Collection.LocationTransferDetails.find({locationTransferId: FlowRouter.getParam('locationTransferId')});
        var i = 1;
        sD.forEach(function (sd) {
            // var item = _.extend(sd,{});
            /*var product = Pos.Collection.Products.findOne(sd.productId);
             var unit = Pos.Collection.Units.findOne(product.unitId).name;
             sd.productName = product.name + "(" + unit + ")";*/
            sd.amountFormatted = numeral(sd.amount).format('0,0.00');
            //sd.order = pad(i, 2);
            sd.order = i;
            i++;
            locationTransferDetailItems.push(sd);
        });
        return locationTransferDetailItems;
    },
    staffs: function () {
        var userStaff = Pos.Collection.UserStaffs.findOne({userId: Meteor.user()._id});
        if (userStaff != null) {
            return Pos.Collection.Staffs.find({
                _id: {$in: userStaff.staffIds},
                branchId: Session.get('currentBranch')
            });
        } else {
            return [];
        }
    },
    customers: function () {
        return Pos.Collection.Customers.find({
            branchId: Session.get('currentBranch')
        });
    },
    products: function () {
        return Pos.Collection.Products.find({status: "enable"});
        /*.map(function (p) {
         var unit = Pos.Collection.Units.findOne(p.unitId).name;
         p.name = p.name + "(" + unit + ")";
         return p;
         });*/
    },
    locationTransfers: function () {
        var id = FlowRouter.getParam('locationTransferId');
        if (id != null || id != "") {
            return Pos.Collection.LocationTransfers.find({
                _id: {$ne: id},
                branchId: Session.get('currentBranch'),
                status: "Unsaved"
            });
        } else {
            return Pos.Collection.LocationTransfers.find({branchId: Session.get('currentBranch'), status: "Unsaved"})
        }
    }
});

Template.pos_locationTransfer.events({
    'keyup #voucher':function(){
      checkIsUpdate();
    },
    'keyup #description': function () {
        checkIsUpdate();
    },
    'change #transaction-type': function () {
        checkIsUpdate();
    },
    'click .btn-remove-imei': function (e) {
        var locationTransferDetailId = Session.get('locationTransferDetailId');
        var thisBtn = $(e.currentTarget);
        // var imei = thisBtn.parents('tr').find('.td-imei').text().trim();
        var imei = this;
        var locationTransferDetail = Pos.Collection.LocationTransferDetails.findOne(locationTransferDetailId);
        var obj = {};
        obj.imei = subtractArray(locationTransferDetail.imei, [imei]);
        Meteor.call('updateLocationTransferDetails', locationTransferDetailId, obj);

    },
    'keyup #input-imei': function (e) {
        if (e.which == 13) {
            var branchId = Session.get('currentBranch');
            var imei = $(e.currentTarget).val().trim();
            if (imei == "") {
                return;
            }
            var locationTransferDetailId = Session.get('locationTransferDetailId');
            var locationTransferDetail = Pos.Collection.LocationTransferDetails.findOne(locationTransferDetailId);
            var inventoryType = 1;
            var inventory;
            if (inventoryType == 1) {
                inventory = Pos.Collection.FIFOInventory.findOne({
                    branchId: branchId,
                    productId: locationTransferDetail.productId
                    //price: pd.price
                }, {sort: {createdAt: -1}});
            }
            if (inventory != null) {
                if (inventory.imei == null || inventory.imei.indexOf(imei) == -1) {
                    alertify.warning("Can't find this IMEI.");
                    return;
                }
            } else {
                alertify.error("Product is out of stock.");
                return;
            }
            var obj = {};
            var imeis = locationTransferDetail.imei == null ? [] : locationTransferDetail.imei;
            if (imeis.indexOf(imei) != -1) {
                alertify.warning('IMEI is already exist.');
                return;
            } else if (locationTransferDetail.imei.count() == locationTransferDetail.quantity) {
                alertify.warning("Number of IMEI can't greater than Quantity.");
                return;
            } else {
                imeis.push(imei);
            }
            obj.imei = imeis;
            Meteor.call('updateLocationTransferDetails', locationTransferDetailId, obj, function (er, re) {
                if (er) {
                    alertify.error(er.message);
                } else {
                    $(e.currentTarget).val('');
                    $(e.currentTarget).focus();
                }
            });
        }
    },
    'click .btn-imei': function () {
        Session.set('locationTransferDetailId', this._id);
        $('#input-imei').val('');
        $('#imei').modal('show');
    },
    'click .resume': function (e) {
        var locationTransferId = $(e.currentTarget).attr('data-id');
        var locationTransfer = Pos.Collection.LocationTransfers.findOne(locationTransferId);
        Session.set('hasUpdate', false);
        $('#customer-id').select2('val', locationTransfer.customerId);
        $('#staff-id').select2('val', locationTransfer.staffId);
        $('#input-locationTransfer-date').val(moment(locationTransfer.locationTransferDate).format('MM/DD/YYYY hh:mm:ss A'));
    },
    'click #btn-update-locationTransfer-data': function () {
        var locationTransferId = $('#locationTransfer-id').val();
        if (locationTransferId == "") return;
        var branchId=Session.get('currentBranch');
        var customer = $('#customer-id').val();
        var staff = $('#staff-id').val();
        var date = $('#input-locationTransfer-date').val();
        var transactionType = $('#transaction-type').val();
        var description = $('#description').val();
        var voucher=$('#voucher').val();
        var locationTransfer=Pos.Collection.LocationTransfers.findOne({branchId:branchId,voucher:voucher,_id:{$ne:locationTransferId}});
        if(locationTransfer!=null){
            alertify.warning('Voucher already exists. Please input other one.');
            return;
        }
        var set = {};
        set.customerId = customer;
        set.staffId = staff;
        set.locationTransferDate = moment(date).toDate();
        set.transactionType = transactionType;
        set.description = description;
        set.voucher=voucher;
        Meteor.call('updateLocationTransfer', locationTransferId, set, function (error, result) {
            if (error)alertify.error(error.message);
        });
        Session.set('hasUpdate', false);
        $('#product-barcode').focus();

    },
    'blur #input-locationTransfer-date': function () {
        checkIsUpdate();
    },
    'change #customer-id': function () {
        checkIsUpdate();
    },
    'change #staff-id': function () {
        checkIsUpdate();
    },
    'click #retail': function (e) {
        var locationTransferId = $('#locationTransfer-id').val();
        $('#wholelocationTransfer').removeClass('btn-primary');
        $('#wholelocationTransfer').addClass('btn-default');
        $('#wholelocationTransfer').attr('disabled', false);
        $(e.currentTarget).removeClass('btn-default');
        $(e.currentTarget).addClass('btn-primary');
        $(e.currentTarget).attr('disabled', true);
        if (locationTransferId == "") {
            Session.set('isRetail', true);
        } else {
            // var locationTransfer=Pos.Collection.LocationTransfers.findOne(locationTransferId);
            Session.set('isRetail', true);
            var set = {};
            set.isRetail = true;
            Meteor.call('updateLocationTransfer', locationTransferId, set);
            Pos.Collection.LocationTransferDetails.find({locationTransferId: locationTransferId}).forEach(function (sd) {
                if (!sd.isPromotion) {
                    var retailPrice = Pos.Collection.Products.findOne(sd.productId).retailPrice;
                    var set = {};
                    set.price = retailPrice;
                    set.amount = (set.price * sd.quantity) * (1 - sd.discount / 100);
                    Meteor.call('updateLocationTransferDetails', sd._id, set);
                }
            });
            // updateLocationTransferSubTotal(locationTransferId);
        }
    },
    'click #wholelocationTransfer': function (e) {
        var locationTransferId = $('#locationTransfer-id').val();
        $('#retail').removeClass('btn-primary');
        $('#retail').addClass('btn-default');
        $('#retail').attr('disabled', false);
        $(e.currentTarget).removeClass('btn-default');
        $(e.currentTarget).addClass('btn-primary');
        $(e.currentTarget).attr('disabled', true);
        if (locationTransferId == "") {
            Session.set('isRetail', false);
        } else {
            Session.set('isRetail', false);
            var set = {};
            set.isRetail = false;
            Meteor.call('updateLocationTransfer', locationTransferId, set);
            Pos.Collection.LocationTransferDetails.find({locationTransferId: locationTransferId}).forEach(function (sd) {
                if (!sd.isPromotion) {
                    var wholelocationTransferPrice = Pos.Collection.Products.findOne(sd.productId).wholelocationTransferPrice;
                    var set = {};
                    set.price = wholelocationTransferPrice;
                    set.amount = (set.price * sd.quantity) * (1 - sd.discount / 100);
                    Meteor.call('updateLocationTransferDetails', sd._id, set);
                }
            });
            // updateLocationTransferSubTotal(locationTransferId);
        }
    },
    'mouseout .la-box,#total_discount,#total_discount_amount': function () {
        $('#product-barcode').focus();
    },
    'click #print-invoice': function () {
        var locationTransferId = $('#locationTransfer-id').val();
        if (locationTransferId == "") return;
        var url = $('#btn-print').attr('href');
        window.open(url, '_blank');
        prepareForm();
    },
    'click #print-locationTransfer': function () {
        var baseCurrencyId = Cpanel.Collection.Setting.findOne().baseCurrency;
        var t = true;
        $('#payment-list tr').each(function () {
            t = $(this).find('.pay-amount').val() == "" ? true : false;
            if (t == false) {
                return false
            }
        });
        if ($('#' + baseCurrencyId).val() == "" || t) {
            alertify.warning("Please input payment amount.");
            return;
        }
        var locationTransferId = $('#locationTransfer-id').val();
        pay(locationTransferId);
        $('#payment').modal('hide');
        var url = $('#btn-print').attr('href');
        window.open(url, '_blank');
        FlowRouter.go('pos.locationTransfer');
        prepareForm();
    },
    'click #save-locationTransfer': function () {
        var baseCurrencyId = Cpanel.Collection.Setting.findOne().baseCurrency;
        var t = true;
        $('#payment-list tr').each(function () {
            t = $(this).find('.pay-amount').val() == "" ? true : false;
            if (t == false) {
                return false
            }
        });
        if ($('#' + baseCurrencyId).val() == "" || t) {
            alertify.warning("Please input payment amount.");
            return
        }
        var locationTransferId = $('#locationTransfer-id').val();
        pay(locationTransferId);
        $('#payment').modal('hide');
        FlowRouter.go('pos.locationTransfer');
        prepareForm();
    },
    'mouseleave .pay-amount': function (e) {
        var value = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        if (!numericReg.test(value)) {
            $(e.currentTarget).val('');
        }
    },
    'change .pay-amount': function (e) {
        var value = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        if (!numericReg.test(value)) {
            $(e.currentTarget).val('');
        }
    },
    'keyup .pay-amount': function () {
        calculatePayment();
    },
    'change #total_discount_amount': function (e) {
        debugger;
        var value = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        var locationTransferId = $('#locationTransfer-id').val();
        if (locationTransferId == "") return;
        var locationTransfer = Pos.Collection.LocationTransfers.findOne(locationTransferId);
        var firstTotalDiscount = locationTransfer.discountAmount == null ? 0 : locationTransfer.discountAmount;
        var discount = parseFloat(value);
        if (!numericReg.test(value) || value == "" || discount < 0) {
            $(e.currentTarget).val(firstTotalDiscount);
            $(e.currentTarget).focus();
            return;
        }
        var baseCurrencyId = Cpanel.Collection.Setting.findOne().baseCurrency;
        var discountPercentage = 100 * discount / locationTransfer.subTotal;
        var total = locationTransfer.subTotal - discount;
        if (baseCurrencyId == "KHR") {
            total = roundRielCurrency(total);
        }
        var set = {};
        set.discount = discountPercentage;
        set.discountAmount = discount;
        set.total = total;

        Meteor.call('directUpdateLocationTransfer', locationTransferId, set);
    },
    'change #total_discount': function (e) {
        var value = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        var locationTransferId = $('#locationTransfer-id').val();
        if (locationTransferId == "") return;
        var locationTransfer = Pos.Collection.LocationTransfers.findOne(locationTransferId);
        var firstTotalDiscount = locationTransfer.discount == null ? 0 : locationTransfer.discount;
        var discount = parseFloat($(e.currentTarget).val());
        if (!numericReg.test(value) || $(e.currentTarget).val() == "" || discount < 0 || discount > 100) {
            $(e.currentTarget).val(firstTotalDiscount);
            $(e.currentTarget).focus();
            return;
        }
        var baseCurrencyId = Cpanel.Collection.Setting.findOne().baseCurrency;
        var total = locationTransfer.subTotal * (1 - discount / 100);
        var discountAmount = locationTransfer.subTotal * discount / 100;
        if (baseCurrencyId == "KHR") {
            total = roundRielCurrency(total);
        }
        var set = {};
        set.discount = discount;
        set.discountAmount = discountAmount;
        set.total = total;

        Meteor.call('directUpdateLocationTransfer', locationTransferId, set);
    },
    'click #save-without-pay': function () {
        var locationTransferId = $('#locationTransfer-id').val();
        if (locationTransferId == "") return;
        var branchId = Session.get('currentBranch');
        Meteor.call('locationTransferManageStock', locationTransferId, branchId, function (er, re) {
            if (er) {
                alertify(er.message);
            }
            else {
                var locationTransferObj = {};
                locationTransferObj.status = 'Owed';
                Meteor.call('updateLocationTransfer', locationTransferId, locationTransferObj);
                alertify.success('LocationTransfer is saved successfully');
                FlowRouter.go('pos.locationTransfer');
            }
        });
    },
    'click #btn-pay': function () {
        if ($('#locationTransfer-id').val() == "") return;
        $('#payment').modal('show');
        clearDataFormPayment();
    },
    'click #cancel-locationTransfer': function () {
        var locationTransferId = $('#locationTransfer-id').val();
        if (locationTransferId == "") return;
        alertify.confirm("Are you sure to cancel this order?")
            .set({
                onok: function (closeEvent) {
                    Meteor.call('cancelLocationTransfer', locationTransferId, function (error) {
                        if (error) {
                            alertify.error(error.message);
                        } else {
                            alertify.success('LocationTransfer is cancelled.');
                        }
                    });
                    FlowRouter.go('pos.locationTransfer');
                    prepareForm();
                },
                title: "Cancel LocationTransfer."
            });
    },
    'click #suspend': function () {
        FlowRouter.go('pos.locationTransfer');
        prepareForm();
    },
    'change #default-quantity': function (e) {
        var val = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        var value = parseFloat($(e.currentTarget).val() == "" ? 0 : $(e.currentTarget).val());
        if (!numericReg.test(val) || value <= 0) {
            $(e.currentTarget).val(1);
            $(e.currentTarget).focus();
            return;
        }
    },
    'change #default-discount': function (e) {
        var val = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        var value = parseFloat($(e.currentTarget).val());
        if (!numericReg.test(val) || $(e.currentTarget).val() == "" || value < 0 || value > 100) {
            $(e.currentTarget).val(0);
            $(e.currentTarget).focus();
            return;
        }
    },
    'keypress #default-quantity,.quantity,.pay-amount': function (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    },
    'keypress #default-discount,.price,.discount,#total_discount': function (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if ($(evt.currentTarget).val().indexOf('.') != -1) {
            if (charCode == 46) {
                return false;
            }
        }
        return !(charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57));
    },

    'change .price': function (e) {
        var locationTransferId = $('#locationTransfer-id').val();
        var val = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        var firstPrice = this.price;
        var price = parseFloat($(e.currentTarget).val() == "" ? 0 : $(e.currentTarget).val());
        if (!numericReg.test(val) || price <= 0) {
            $(e.currentTarget).val(firstPrice);
            $(e.currentTarget).focus();
            return;
        }
        var set = {};
        set.price = price;
        set.amount = (price * this.quantity) * (1 - this.discount / 100);
        Meteor.call('updateLocationTransferDetails', this._id, set);
        // updateLocationTransferSubTotal(locationTransferId);
    },
    'change .quantity': function (e) {
        var val = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;

        var firstQuantity = this.quantity;
        var quantity = parseInt($(e.currentTarget).val() == "" ? 0 : $(e.currentTarget).val());
        if (!numericReg.test(val) || quantity <= 0) {
            $(e.currentTarget).val(firstQuantity);
            $(e.currentTarget).focus();
            return;
        }
        if (this.imei.count() > quantity) {
            alertify.warning("Quantity can't be less than number of IMEI.");
            $(e.currentTarget).val(firstQuantity);
            return;
        }

        var locationTransferId = $('#locationTransfer-id').val();
        var branchId = Session.get('currentBranch');
        var sdId = this._id;
        var set = {};
        set.quantity = quantity;
        set.amount = (this.price * quantity) * (1 - this.discount / 100);

        var data = locationTransferStock(this.productId, quantity, branchId, locationTransferId);
        if (data.valid) {
            Meteor.call('updateLocationTransferDetails', sdId, set);
        } else {
            alertify.warning(data.message);
            $(e.currentTarget).val(firstQuantity);
        }
        // updateLocationTransferSubTotal(FlowRouter.getParam('locationTransferId'));
    },
    'change .discount': function (e) {
        var val = $(e.currentTarget).val();
        var numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;

        var firstDiscount = this.discount;
        var discount = parseFloat($(e.currentTarget).val());
        if (!numericReg.test(val) || discount < 0 || discount > 100 || $(e.currentTarget).val() == "") {
            $(e.currentTarget).val(firstDiscount);
            $(e.currentTarget).focus();
            return;
        }
        var set = {};
        set.discount = discount;
        set.amount = (this.price * this.quantity) * (1 - discount / 100);
        Meteor.call('updateLocationTransferDetails', this._id, set);
        // updateLocationTransferSubTotal(FlowRouter.getParam('locationTransferId'));
    },
    'click .btn-remove': function () {
        Pos.Collection.LocationTransferDetails.remove(this._id);
        var sd = Pos.Collection.LocationTransferDetails.find({locationTransferId: FlowRouter.getParam('locationTransferId'), isPromotion: {$ne: true}});
        if (sd.count() == 0) {
            Pos.Collection.LocationTransfers.remove(FlowRouter.getParam('locationTransferId'));
            FlowRouter.go('pos.locationTransfer');
            prepareForm();
        }
        /*else {
         updateLocationTransferSubTotal(FlowRouter.getParam('locationTransferId'));
         }*/
    },
    'click .staffInsertAddon': function () {
        alertify.userStaff(fa('plus','Add New Staff'),renderTemplate(Template.pos_userStaffInsert));
        // .maximize();
    },
    'click .customerInsertAddon': function () {
        alertify.customer(fa('plus','Add New Customer'),renderTemplate(Template.pos_customerInsert));
        // .maximize();
    },
    'change #product-id': function () {
        var id = $('#product-id').val();
        if (id == "") return;
        var isRetail = Session.get('isRetail');
        var locationTransferId = $('#locationTransfer-id').val();
        var branchId = Session.get('currentBranch');
        var data = getValidatedValues('id', id, branchId, locationTransferId);
        if (data.valid) {
            addOrUpdateProducts(branchId, locationTransferId, isRetail, data.product, data.locationTransferObj);
        } else {
            alertify.warning(data.message);
        }
        $('#product-id').select2('val', '');
        $('#product-barcode').val('');
        $('#product-barcode').focus();
    },
    'keyup #product-barcode': function (e) {
        var charCode = e.which;
        if (e.which == 13) {
            var barcode = $('#product-barcode').val();
            var isRetail = Session.get('isRetail');
            var locationTransferId = $('#locationTransfer-id').val();
            var branchId = Session.get('currentBranch');
            var data = getValidatedValues('barcode', barcode, branchId, locationTransferId);
            if (data.valid) {
                addOrUpdateProducts(branchId, locationTransferId, isRetail, data.product, data.locationTransferObj);
            } else {
                alertify.warning(data.message);
            }
            $('#product-id').select2('val', '');
            $('#product-barcode').val('');
            $('#product-barcode').focus();
        }
    }
});
function locationTransferStock(productId, newQty, branchId, locationTransferId) {
    var data = {};
    var product = Pos.Collection.Products.findOne(productId);
    if (product.productType == "Stock") {
        var inventoryType = 1;
        var inventory;
        if (inventoryType == 1) {
            inventory = Pos.Collection.FIFOInventory.findOne({
                branchId: branchId,
                productId: productId
                //price: pd.price
            }, {sort: {createdAt: -1}});
        }
        if (inventory != null) {
            var remainQuantity = inventory.remainQty - newQty;
            if (remainQuantity < 0) {
                data.valid = false;
                data.message = 'Product is out of stock. Quantity in stock is "' + inventory.remainQty + '".';
                return data;
            }
            var unSavedLocationTransferId = Pos.Collection.LocationTransfers.find({
                status: "Unsaved",
                branchId: Session.get('currentBranch'),
                _id: {$ne: locationTransferId}
            }).map(function (s) {
                return s._id;
            });
            var otherLocationTransferDetails = Pos.Collection.LocationTransferDetails.find({
                locationTransferId: {$in: unSavedLocationTransferId},
                productId: product._id
            });
            var otherQuantity = 0;
            if (otherLocationTransferDetails != null) {
                otherLocationTransferDetails.forEach(function (sd) {
                    otherQuantity += sd.quantity;
                });
            }
            remainQuantity = remainQuantity - otherQuantity;
            if (remainQuantity < 0) {
                data.valid = false;
                data.message = 'Product is out of stock. Quantity in stock is "' +
                    inventory.remainQty + '". And quantity on locationTransfer of other seller is "' + otherQuantity + '".';
                return data;
            }
        } else {
            data.valid = false;
            data.message = "Don't have product in stock.";
            return data;
        }
    }
    data.valid = true;
    data.message = "Product is OK.";
    return data;

}
function getValidatedValues(fieldName, val, branchId, locationTransferId) {
    var data = {};
    var id = Cpanel.Collection.Setting.findOne().baseCurrency;
    var exchangeRate = Pos.Collection.ExchangeRates.findOne({
        base: id,
        branchId: branchId
    }, {sort: {_id: -1, createdAt: -1}});
    if (exchangeRate == null) {
        data.valid = false;
        data.message = "Please input exchange rate for this branch.";
        return data;
    }
    var voucher=$('#voucher').val();
    if(voucher==''){
        data.valid=false;
        data.message="Please input voucher.";
        return data;
    }else{
		if(locationTransferId==''){
        var locationTransfer=Pos.Collection.LocationTransfers.findOne({voucher:voucher,branchId:branchId,});
        if(locationTransfer!=null){
            data.valid=false;
            data.message='Voucher already exists. Please input the other one.';
            return data;
        }
		}
    }
    var locationTransferDate = $('#input-locationTransfer-date').val();
    if (locationTransferDate == '') {
        data.valid = false;
        data.message = "Please input locationTransferDate";
        return data;
    }

    var staffId = $('#staff-id').val();
    if (staffId == '') {
        data.valid = false;
        data.message = "Please select staff name.";
        return data;
    }

    var customerId = $('#customer-id').val();
    if (customerId == "") {
        data.valid = false;
        data.message = "Please select customer name.";
        return data;
    }
    var transactionType = $('#transaction-type').val();
    if (transactionType == "") {
        data.valid = false;
        data.message = "Please select transaction type.";
        return data;
    }

    var product;
    if (fieldName == 'id') {
        product = Pos.Collection.Products.findOne(val);
    } else {
        product = Pos.Collection.Products.findOne({barcode: val, status: "enable"});
    }
    if (product != null) {
        var defaultQuantity = $('#default-quantity').val() == "" ? 1 : parseInt($('#default-quantity').val());
        if (product.productType == "Stock") {
            var sd = Pos.Collection.LocationTransferDetails.findOne({productId: product._id, locationTransferId: locationTransferId});
            if (sd != null) {
                defaultQuantity = defaultQuantity + sd.quantity;
            }
            var inventoryType = 1;
            var inventory;
            if (inventoryType == 1) {
                inventory = Pos.Collection.FIFOInventory.findOne({
                    branchId: branchId,
                    productId: product._id
                    //price: pd.price
                }, {sort: {createdAt: -1}});
            }
            if (inventory != null) {
                var remainQuantity = inventory.remainQty - defaultQuantity;
                if (remainQuantity < 0) {
                    data.valid = false;
                    data.message = 'Product is out of stock. Quantity in stock is "' + inventory.remainQty + '".';
                    return data;
                }
                var unSavedLocationTransferId = Pos.Collection.LocationTransfers.find({
                    status: "Unsaved",
                    branchId: Session.get('currentBranch'),
                    locationTransferId: {$ne: locationTransferId}
                }).map(function (s) {
                    return s._id;
                });
                var otherLocationTransferDetails = Pos.Collection.LocationTransferDetails.find({
                    locationTransferId: {$in: unSavedLocationTransferId},
                    productId: product._id
                });
                var otherQuantity = 0;
                if (otherLocationTransferDetails != null) {
                    otherLocationTransferDetails.forEach(function (sd) {
                        otherQuantity += sd.quantity;
                    });
                }
                remainQuantity = remainQuantity - otherQuantity;
                if (remainQuantity < 0) {
                    data.valid = false;
                    data.message = 'Product is out of stock. Quantity in stock is "' +
                        inventory.remainQty + '". And quantity on locationTransfer of other seller is "' + otherQuantity + '".';
                    return data;
                }
            } else {
                data.valid = false;
                data.message = "Don't have product in stock.";
                return data;
            }
        }

    } else {
        data.valid = false;
        data.message = "Can't find this Product";
        return data;
    }
    data.message = "Add product to list is successfully.";
    data.valid = true;
    data.locationTransferObj = {
        locationTransferDate: moment(locationTransferDate).toDate(),
        staffId: staffId,
        customerId: customerId,
        exchangeRateId: exchangeRate._id,
        description: $('#description').val(),
        transactionType:transactionType,
        voucher:voucher
    };
    data.product = product;
    return data;
}
function addOrUpdateProducts(branchId, locationTransferId, isRetail, product, locationTransferObj) {

    var defaultQuantity = $('#default-quantity').val() == "" ? 1 : parseInt($('#default-quantity').val());
    var defaultDiscount = $('#default-discount').val() == "" ? 0 : parseFloat($('#default-discount').val());
    if (locationTransferId == '') {
        // var exchange=parseFloat($('#last-exchange-rate').text());
        var totalDiscount = $('#total_discount').val() == "" ? 0 : parseFloat($('#total_discount').val());
        locationTransferObj.status = "Unsaved";
        locationTransferObj.subTotal = 0;
        locationTransferObj.discount = totalDiscount;
        locationTransferObj.discountAmount = 0;
        locationTransferObj.total = 0;
        locationTransferObj.branchId = branchId;
        locationTransferObj.isRetail = isRetail;
        var locationTransferDetailObj = {};
        locationTransferDetailObj.productId = product._id;
        locationTransferDetailObj.quantity = defaultQuantity;
        locationTransferDetailObj.discount = defaultDiscount;
        locationTransferDetailObj.imei = [];
        locationTransferDetailObj.price = isRetail ? product.retailPrice : product.wholelocationTransferPrice;
        locationTransferDetailObj.amount = (locationTransferDetailObj.price * defaultQuantity) * (1 - defaultDiscount / 100);
        locationTransferDetailObj.branchId = branchId;
        Meteor.call('insertLocationTransferAndLocationTransferDetail', locationTransferObj, locationTransferDetailObj, function (e, r) {
            $('#product-barcode').focus();
            if (e) {
                alertify.error("Can't make a locationTransfer.");
            } else {
                // updateLocationTransferSubTotal(newId);
                $('#product-barcode').val('');
                $('#product-barcode').focus();
                $('#product-id').select2('val', '');
                FlowRouter.go('pos.locationTransfer', {locationTransferId: r});
            }
        });
    } else {
        var locationTransferDetail = Pos.Collection.LocationTransferDetails.findOne({
            productId: product._id,
            locationTransferId: locationTransferId,
            isPromotion: {$ne: true}
        });
        if (locationTransferDetail == null) {
            var locationTransferDetailObj = {};
            locationTransferDetailObj._id = idGenerator.genWithPrefix(Pos.Collection.LocationTransferDetails, locationTransferId, 3);
            locationTransferDetailObj.locationTransferId = locationTransferId;
            locationTransferDetailObj.quantity = defaultQuantity;
            locationTransferDetailObj.discount = defaultDiscount;
            locationTransferDetailObj.productId = product._id;
            locationTransferDetailObj.price = isRetail == true ? product.retailPrice : product.wholelocationTransferPrice;
            locationTransferDetailObj.amount = (locationTransferDetailObj.price * defaultQuantity) * (1 - defaultDiscount / 100);
            locationTransferDetailObj.branchId = branchId;
            locationTransferDetailObj.imei = [];
            Meteor.call('insertLocationTransferDetails', locationTransferDetailObj);
        } else {
            var set = {};
            //need to locationTransfer
            set.discount = defaultDiscount;
            set.quantity = (locationTransferDetail.quantity + defaultQuantity);
            set.amount = (locationTransferDetail.price * set.quantity) * (1 - defaultDiscount / 100);
            Meteor.call('updateLocationTransferDetails', locationTransferDetail._id, set);
        }
        $('#product-barcode').val('');
        $('#product-barcode').focus();
        $('#product-id').select2('val', '');
        // updateLocationTransferSubTotal(locationTransferId);
    }
}
function addOrUpdateProductsOld(locationTransferId, product, isRetail) {
    var locationTransferDate = $('#input-locationTransfer-date').val();
    var branchId = Session.get('currentBranch');
    var id = Cpanel.Collection.Setting.findOne().baseCurrency;
    var exchangeRate = Pos.Collection.ExchangeRates.findOne({
        base: id,
        branchId: branchId
    }, {sort: {_id: -1, createdAt: -1}});
    var exchangeRateId = "";
    if (exchangeRate == null) {
        alertify.alert("Please set your exchange rate for this branch.")
            .set({title: "Exchange Rate is required."});
        $('#product-id').select2('val', '');
        return;
    } else {
        exchangeRateId = exchangeRate._id
    }
    var customerId = $('#customer-id').val();
    var staffId = $('#staff-id').val();
    if (customerId == "" || staffId == "" || customerId == null || staffId == null || locationTransferDate == "") {
        alertify.alert("Please input all Require data (*)")
            .set({title: "Data is Required."});
        $('#product-id').select2('val', '');
        $('#product-barcode').val('');
        $('#product-barcode').focus();
        return;
    }
    var defaultQuantity = $('#default-quantity').val() == "" ? 1 : parseInt($('#default-quantity').val());
    var defaultDiscount = $('#default-discount').val() == "" ? 0 : parseFloat($('#default-discount').val());
    if (locationTransferId == '') {
        // var exchange=parseFloat($('#last-exchange-rate').text());
        var totalDiscount = $('#total_discount').val() == "" ? 0 : parseFloat($('#total_discount').val());
        var locationTransferObj = {};
        //locationTransferObj._id = newId;
        locationTransferObj.customerId = customerId;
        locationTransferObj.staffId = staffId;
        locationTransferObj.status = "Unsaved";
        locationTransferObj.subTotal = 0;
        locationTransferObj.discount = totalDiscount;
        locationTransferObj.discountAmount = 0;
        locationTransferObj.total = 0;
        locationTransferObj.branchId = branchId;
        locationTransferObj.isRetail = isRetail;
        locationTransferObj.exchangeRateId = exchangeRateId;
        locationTransferObj.locationTransferDate = moment(locationTransferDate).toDate();
        var locationTransferDetailObj = {};
        locationTransferDetailObj.productId = product._id;
        locationTransferDetailObj.quantity = defaultQuantity;
        locationTransferDetailObj.discount = defaultDiscount;

        locationTransferDetailObj.price = isRetail ? product.retailPrice : product.wholelocationTransferPrice;
        locationTransferDetailObj.amount = (locationTransferDetailObj.price * defaultQuantity) * (1 - defaultDiscount / 100);
        locationTransferDetailObj.branchId = branchId;
        Meteor.call('insertLocationTransferAndLocationTransferDetail', locationTransferObj, locationTransferDetailObj, function (e, r) {
            $('#product-barcode').focus();
            if (e) {
                alertify.error("Can't make a locationTransfer.");
            } else {
                // updateLocationTransferSubTotal(newId);
                $('#product-barcode').val('');
                $('#product-barcode').focus();
                $('#product-id').select2('val', '');
                FlowRouter.go('pos.locationTransfer', {locationTransferId: r});
            }
        });


        //
    } else {
        var locationTransferDetail = Pos.Collection.LocationTransferDetails.findOne({
            productId: product._id,
            locationTransferId: locationTransferId,
            isPromotion: {$ne: true}
        });
        if (locationTransferDetail == null) {
            var locationTransferDetailObj = {};
            locationTransferDetailObj._id = idGenerator.genWithPrefix(Pos.Collection.LocationTransferDetails, locationTransferId, 3);
            locationTransferDetailObj.locationTransferId = locationTransferId;
            locationTransferDetailObj.quantity = defaultQuantity;
            locationTransferDetailObj.discount = defaultDiscount;
            locationTransferDetailObj.productId = product._id;
            locationTransferDetailObj.price = isRetail == true ? product.retailPrice : product.wholelocationTransferPrice;
            locationTransferDetailObj.amount = (locationTransferDetailObj.price * defaultQuantity) * (1 - defaultDiscount / 100);
            locationTransferDetailObj.branchId = branchId;
            Meteor.call('insertLocationTransferDetails', locationTransferDetailObj);
        } else {
            var set = {};
            //need to locationTransfer
            set.discount = defaultDiscount;
            set.quantity = (locationTransferDetail.quantity + defaultQuantity);
            set.amount = (locationTransferDetail.price * set.quantity) * (1 - defaultDiscount / 100);
            Meteor.call('updateLocationTransferDetails', locationTransferDetail._id, set);
        }
        $('#product-barcode').val('');
        $('#product-barcode').focus();
        $('#product-id').select2('val', '');
        // updateLocationTransferSubTotal(locationTransferId);
    }
}
function updateLocationTransferSubTotal(locationTransferId) {
    var discount = Pos.Collection.LocationTransfers.findOne(locationTransferId).discount;
    var locationTransferSubTotal = 0;
    var locationTransferDetails = Pos.Collection.LocationTransferDetails.find({locationTransferId: locationTransferId});
    locationTransferDetails.forEach(function (locationTransferDetail) {
        locationTransferSubTotal += parseFloat(locationTransferDetail.amount);
    });
    var baseCurrencyId = Cpanel.Collection.Setting.findOne().baseCurrency;
    var total = locationTransferSubTotal * (1 - discount / 100);
    if (baseCurrencyId == "KHR") {
        total = roundRielCurrency(total);
    }
    var set = {};
    set.subTotal = locationTransferSubTotal;
    set.total = total;
    Meteor.call('updateLocationTransfer', locationTransferId, set);
}
function clearDataFormPayment() {
    $('.pay-amount').val('');
    $('.return-amount').val('');
}
function calculatePayment() {
    var total = 0;
    var dueTotal = parseFloat($('#due-grand-total').text().trim());
    $('#payment-list tr').each(function () {
        var currencyId = $(this).find('.currency-id').text();
        var pay = $(this).find('.pay-amount').val() == "" ? 0 : $(this).find('.pay-amount').val();
        var rate = $(this).find('.exchange-rate').val() == "" ? 0 : $(this).find('.exchange-rate').val();
        var payCheckCurrency = currencyId == "KHR" ? roundDownRielCurrency(parseFloat(pay)) : parseFloat(pay);
        total += payCheckCurrency / parseFloat(rate);
    });
    total = total - dueTotal;
    $('#payment-list tr').each(function () {
        var currencyId = $(this).find('.currency-id').text();
        var rate = $(this).find('.exchange-rate').val() == "" ? 0 : $(this).find('.exchange-rate').val();
        var returnAmount = (total) * parseFloat(rate);
        if (currencyId == "KHR") {
            $(this).find('.return-amount').val(numeral(roundRielCurrency(returnAmount)).format('0,0.00'));
        } else {
            $(this).find('.return-amount').val(numeral(returnAmount).format('0,0.00'));
        }
    });
    var returnKHR = $('#KHR').val();
    if (returnKHR != null) {
        if (parseFloat(returnKHR) == 0) {
            $('.return-amount').val(numeral(0).format('0,0.00'));
        }
    }
}
function pay(locationTransferId) {
    var branchId = Session.get('currentBranch');
    var obj = {};
    obj.payments = [];
    var totalPay = 0;
    $('#payment-list tr').each(function () {
        var currencyId = $(this).find('.currency-id').text();
        var pay = $(this).find('.pay-amount').val() == "" ? 0 : $(this).find('.pay-amount').val();
        var rate = $(this).find('.exchange-rate').val() == "" ? 0 : $(this).find('.exchange-rate').val();
        var returnAmount = $(this).find('.return-amount').val();
        returnAmount = numeral().unformat(returnAmount);
        pay = parseFloat(pay);
        rate = parseFloat(rate);
        totalPay += pay / rate;
        obj.payments.push(
            {
                currencyId: currencyId,
                payAmount: pay,
                rate: rate,
                return: returnAmount
            }
        );
    });
    /*if(totalPay==0){
     return;
     }*/
    var baseCurrencyId = Cpanel.Collection.Setting.findOne().baseCurrency;
    obj._id = idGenerator.genWithPrefix(Pos.Collection.Payments, locationTransferId, 3);
    obj.paymentDate = new Date();
    obj.locationTransferId = locationTransferId;

    obj.payAmount = totalPay;
    obj.payAmount = numeral().unformat(numeral(totalPay).format('0,0.00'));
    obj.dueAmount = parseFloat($('#due-grand-total').text().trim());
    obj.balanceAmount = numeral().unformat(numeral(obj.dueAmount - obj.payAmount).format('0,0.00'));
    //obj.balanceAmount = numeral().unformat($('#' + baseCurrencyId).val());
    obj.status = obj.balanceAmount >= 0 ? "Paid" : "Owed";
    obj.branchId = branchId;
    Meteor.call('insertPayment', obj);

    Meteor.call('locationTransferManageStock', locationTransferId, branchId, function (er, re) {
        if (er) alertify(er.message);
    });
    /*   var locationTransferDetails = Pos.Collection.LocationTransferDetails.find({locationTransferId: locationTransferId});
     var prefix = branchId + "-";
     locationTransferDetails.forEach(function (sd) {
     var product = Pos.Collection.Products.findOne(sd.productId);
     if (product.productType == "Stock") {
     var stock = Pos.Collection.Stocks.findOne({productId: sd.productId, branchId: branchId});
     if (stock == null) {
     var obj = {};
     obj._id = idGenerator.genWithPrefix(Pos.Collection.Stocks, prefix, 6);
     obj.productId = sd.productId;
     obj.branchId = branchId;
     obj.quantity = 0 - sd.quantity;
     Meteor.call('insertStock', obj);
     } else {
     var set = {};
     set.quantity = stock.quantity - sd.quantity;
     Meteor.call('updateStock', stock._id, set);
     }
     }
     });*/
}
function checkIsUpdate() {
    var locationTransferId = $('#locationTransfer-id').val();
    if (locationTransferId == "") {
        Session.set('hasUpdate', false);
        return;
    }
    var locationTransfer = Pos.Collection.LocationTransfers.findOne(locationTransferId);
    var transactionType = $('#transaction-type').val();
    var customer = $('#customer-id').val();
    var staff = $('#staff-id').val();
    var date = $('#input-locationTransfer-date').val();
    var locationTransferDate = moment(locationTransfer.locationTransferDate).format('MM/DD/YYYY hh:mm:ss A');
    var description = $('#description').val();
    var hasUpdate = false;
    var voucher=$('#voucher').val();
    if (date != locationTransferDate || customer != locationTransfer.customerId ||
        staff != locationTransfer.staffId || transactionType != locationTransfer.transactionType ||
        description != locationTransfer.description || voucher!=locationTransfer.voucher) {
        hasUpdate = true;
    }
    Session.set('hasUpdate', hasUpdate);
}
function prepareForm() {
    setTimeout(function () {
        Session.set('isRetail', true);
        Session.set('hasUpdate', false);
        $('#input-locationTransfer-date').val('');
        $('#voucher').val('');
        $('#staff-id').select2();
        $('#customer-id').select2();
        $('#product-barcode').focus();
        $('#product-id').select2('val', '');
        $('#transaction-type').select2('val', 'LocationTransfer');
    }, 200);
}
function subtractArray(src, filt) {
    var temp = {}, i, result = [];
    // load contents of filt into an object
    // for faster lookup
    for (i = 0; i < filt.length; i++) {
        temp[filt[i]] = true;
    }

    // go through each item in src
    for (i = 0; i < src.length; i++) {
        if (!(src[i] in temp)) {
            result.push(src[i]);
        }
    }
    return (result);
}
