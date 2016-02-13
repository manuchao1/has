function create_dummies(storage) {
	var c2 = new Customer(undefined, 'Gertrude', 'Töner', 'f', 'Eckgasse 123', 53211, 'München');
	var i1 = new Item(undefined, '1.1', 'Banana', 123);
	var i2 = new Item(undefined, '2.1', 'Apple', 987);

	Promise.all([
	             storage.create_customer(c1),
	             storage.create_customer(c2),
	             storage.create_item(i1),
	             storage.create_item(i2),
	            ])
	.then(function(results) {
		var b1 = new Bill(undefined, results[0].id, 'Beinbruch', new Date(), 'Hi there', false, false, [results[2], results[3]]);
		storage.create_bill(b1);
		console.log('dummies created.');
	});
}

function create_storage() {
	return create_indexed_database().then(function(db) {
		var storage = new Storage(db);

		if (false) {
			console.log('resetting db...');

			if (!false) {
				create_dummies(storage);
			} else {
				req = indexedDB.deleteDatabase('bills');
			}
		}

		return storage;
	});
	
}

function Storage(db) {
	this.db = db;
}

Storage.prototype = {
	constructor: Storage,

	// all these functions return a Promise!

	get_customer: function(id) {
		return this.db.get_customer(id);
	},

	save_customer: function(customer) {
		return this.db.save_customer(customer);
	},

	create_customer: function(customer) {
		return this.db.create_customer(customer);
	},

	list_customers: function() {
		return this.db.list_customers();
	},

	get_bill: function(id) {
		return this.db.get_bill(id);
	},

	save_bill: function(bill) {
		return this.db.save_bill(bill);
	},

	create_bill: function(bill) {
		return this.db.create_bill(bill);
	},

	list_bills: function(options) {
		return this.db.list_bills(options);
	},

	create_item: function(item) {
		return this.db.create_item(item);
	},

	unprinted_bill_count: function() {
		return this.db.unprinted_bill_count();
	},

	list_unprinted_bills: function() {
		return this.db.list_unprinted_bills();
	},

	list_items: function(item) {
		return this.db.list_items(item);
	},

	get_item: function(id) {
		return this.db.get_item(id);
	},

	create_item: function(item) {
		return this.db.create_item(item);
	},

	save_item: function(item) {
		return this.db.save_item(item);
	},

	delete_item: function(item) {
		return this.db.delete_item(item);
	},

	get_settings: function() {
		return this.db.get_settings();
	},

	set_settings: function(settings) {
		return this.db.set_settings(settings);
	},

	is_pdf_created: function(bill_id) {
	},

	save_pdf: function(bill_id, pdf) {
		return this.db.save_pdf(bill_id, pdf);
	},
};

