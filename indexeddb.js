log_error = function(err) {
	console.error(err);
}

window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: 'readwrite'}; 
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

if (!window.indexedDB) {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB.');
}

function IndexedDatabase(db) {
	this.db = db;
}

var cursor_to_bills = function(resolve, reject, transaction, indexed_db) {
	var bill_list = [];
	var get_customer_promise_list = [];

	return function(ev) {
		var cursor = ev.target.result;
		console.log(cursor);

		if (cursor) {
			var b = convert.bill(cursor.value);
			var promise = indexed_db.get_customer(b.customer_id, {transaction: transaction});
			promise = promise.then(function(customer) {
				b.customer = customer;
			});

			bill_list.push(b);
			get_customer_promise_list.push(promise);

			cursor.continue();
		}
		else {
			console.log('get_customer_promise_list', get_customer_promise_list);
			return Promise.all(get_customer_promise_list).then(function() {
				console.log(bill_list);
				resolve(bill_list);
			}, function(args) {
				console.error('get_customer_promise_list failed', args);
				reject();
			});
		}
	};
}

function create_indexed_database() {
	return new Promise(function (resolve, reject) {
		var req = window.indexedDB.open('bills', 4);
		
		req.onerror = function(e) {
			reject();
			log_error(e);
		};
		req.onsuccess = function(ev) {
			var db = ev.target.result;
			resolve(new IndexedDatabase(db));
		};

		req.onupgradeneeded = function(ev) {
			var db = ev.target.result;

			var opts = {keyPath: 'id', autoIncrement: true};
			var customers = db.createObjectStore('customers', opts);

			var opts = {keyPath: 'id', autoIncrement: true};
			var bills = db.createObjectStore('bills', opts);

			bills.createIndex('is_printed', 'is_printed', { unique: false });
			bills.createIndex('is_paid', 'is_paid', { unique: false });

			var opts = {keyPath: 'id', autoIncrement: true};
			var items = db.createObjectStore('items', opts);

			var opts = {keyPath: 'id', autoIncrement: true};
			var pdfs = db.createObjectStore('pdfs', opts);

			var settings = db.createObjectStore('settings', {});
		}
	});
}

var convert = {
	object: function(klass) {
		var obj = {};
		for (var i in klass) {
			if (typeof(klass[i]) !== 'function') {
				obj[i] = klass[i];
			}
		}
		return obj;
	},

	customer: function(c) {
		return new Customer(c.id, c.forename, c.surname, c.gender, c.street,
		                    c.zip, c.city);
	},


	bill: function(b) {
		var positions = b.positions.map(function(pos) {
			pos.date = new Date(pos.date);
			return pos;
		})
		return new Bill(b.id, b.customer_id, b.subject, new Date(b.date), b.correspondence, b.is_printed != 0, b.is_paid != 0, positions);
	},


	item: function(i) {
		return new Item(i.id, i.number, i.description, i.price);
	},
};

IndexedDatabase.prototype = {
	constructor: IndexedDatabase,

	create_customer: function(customer) {
		var fn = function(object_store, customer) {
			return object_store.add(customer);
		};
		delete customer['id'];
		return this._save_customer(customer, fn);
	},


	save_customer: function(customer) {
		var fn = function(object_store, customer) {
			return object_store.put(customer);
		};
		return this._save_customer(customer, fn);
	},


	_save_customer: function(customer, put_fn) {
		var db = this.db;
		var customer = convert.object(customer);

		return new Promise(function (resolve, reject) {
			var object_store = db.transaction('customers', 'readwrite')
			                     .objectStore('customers');

			var req = put_fn(object_store, customer);
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				customer.id = ev.target.result;
				resolve(customer);
			};
		});
	},


	get_customer: function(id, options) {
		var db = this.db;
		var options = options || {};
		var transaction = options.transaction || db.transaction('customers', 'readonly');

		return new Promise(function (resolve, reject) {
			var object_store = transaction.objectStore('customers');

			var req = object_store.get(parseInt(id));
			req.onerror = function(e) {
				console.error('error while finding customer with id', parseInt(id));
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				var c = req.result;
				if (c) {
					resolve(convert.customer(c));
				} else {
					console.error('there is no customer with id', parseInt(id));
					reject();
				}
			};
		});
	},


	list_customers: function() {
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var object_store = db.transaction('customers', 'readonly')
			                     .objectStore('customers');

			var customer_list = [];
			var req = object_store.openCursor();
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				var cursor = ev.target.result;

				if (cursor) {
					var c = convert.customer(cursor.value);
					customer_list.push(c);
					cursor.continue();
				}
				else {
					resolve(customer_list);
				}
			};
		});
	},


	list_bills: function(options) {
		var self = this;
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var transaction = db.transaction(['bills','customers'], 'readonly');
			var bill_store = transaction.objectStore('bills');
			var customer_store = transaction.objectStore('customers');

			var req = bill_store.openCursor();
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = cursor_to_bills(resolve, reject, transaction, self);
		});
	},


	list_unprinted_bills: function() {
		var self = this;
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var transaction = db.transaction(['bills', 'customers'], 'readonly');
			var bill_store = transaction.objectStore('bills');

			var req = bill_store.index('is_printed').openCursor(IDBKeyRange.only(0));
			req.onsuccess = cursor_to_bills(resolve, reject, transaction, self);
/*
			req.onsuccess = function(ev) {
				var cursor = ev.target.result;

				if (cursor) {
					var b = convert.bill(cursor.value);
					var promise = self.get_customer(b.customer_id, {transaction: transaction});
					promise = promise.then(function(customer) {
						b.customer = customer;
					});

					bill_list.push(b);
					get_customer_promise_list.push(promise);

					cursor.continue();
				}
				else {
					Promise.all(get_customer_promise_list).then(function() {
						console.log(bill_list);
						resolve(bill_list);
					});
				}
			};*/
		});
	},


	unprinted_bill_count: function() {
		var self = this;
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var transaction = db.transaction(['bills'], 'readonly');
			var bill_store = transaction.objectStore('bills');

			var req = bill_store.index('is_printed').count(IDBKeyRange.only(0));
			req.onsuccess = function(ev) {
				var count = ev.target.result;
				resolve(count);
			};
		});
	},


	get_bill: function(id) {
		var self = this;
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var transaction = db.transaction(['bills','customers'], 'readonly');
			var bill_store = transaction.objectStore('bills');
			var customer_store = transaction.objectStore('customers');

			var req = bill_store.get(parseInt(id));
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				var b = req.result;

				if (b) {
					var b = convert.bill(b);
					var promise = self.get_customer(b.customer_id, {transaction: transaction});
					promise.then(function(customer) {
						b.customer = customer;
						resolve(b);
					});
				}
				else {
					reject();
				}
			};
		});
	},


	create_bill: function(bill) {
		var fn = function(object_store, bill) {
			return object_store.add(bill);
		};
		delete bill['id'];
		return this._save_bill(bill, fn);
	},


	save_bill: function(bill) {
		var fn = function(object_store, bill) {
			return object_store.put(bill);
		};
		return this._save_bill(bill, fn);
	},


	_save_bill: function(bill, put_fn) {
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var object_store = db.transaction('bills', 'readwrite')
			                     .objectStore('bills');

			bill.is_printed = bill.is_printed ? 1 : 0;
			bill.is_paid = bill.is_paid ? 1 : 0;
			var req = put_fn(object_store, bill);
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				bill.id = ev.target.result;
				resolve(bill);
			};
		});
	},


	create_item: function(item) {
		var fn = function(object_store, item) {
			return object_store.add(item);
		};
		delete item['id'];
		return this._save_item(item, fn);
	},


	save_item: function(item) {
		var fn = function(object_store, item) {
			return object_store.put(item);
		};
		return this._save_item(item, fn);
	},


	_save_item: function(item, put_fn) {
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var object_store = db.transaction('items', 'readwrite')
			                     .objectStore('items');

			var req = put_fn(object_store, item);
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				item.id = ev.target.result;
				resolve(item);
			};
		});
	},


	get_item: function(id, options) {
		var db = this.db;
		var options = options || {};
		var transaction = options.transaction || db.transaction('items', 'readonly');

		return new Promise(function (resolve, reject) {
			var object_store = transaction.objectStore('items');

			var req = object_store.get(parseInt(id));
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				var item = req.result;
console.log(id, item, ev, req);
				if (item) {
					resolve(convert.item(item));
				} else {
					reject();
				}
			};
		});
	},


	list_items: function() {
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var object_store = db.transaction('items', 'readonly')
			                     .objectStore('items');

			var item_list = [];
			var req = object_store.openCursor();
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				var cursor = ev.target.result;

				if (cursor) {
					var item = convert.item(cursor.value);
					item_list.push(item);
					cursor.continue();
				}
				else {
					resolve(item_list);
				}
			};
		});
	},


	is_pdf_created: function(bill_id) {
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var transaction = db.transaction('pdfs', 'readonly');
			var object_store = transaction.objectStore('pdfs');

			var req = object_store.put({id: bill_id, file: pdf});
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				resolve(bill_id);
			};
		});
	},


	save_pdf: function(bill_id, pdf) {
		var db = this.db;
		var options = options || {};
		var transaction = options.transaction || db.transaction('items', 'readonly');

		return new Promise(function (resolve, reject) {
			var object_store = transaction.objectStore('items');

			var req = object_store.get(parseInt(id));
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				var item = req.result;
console.log(id, item, ev, req);
				if (item) {
					resolve(convert.item(item));
				} else {
					reject();
				}
			};
		});
	},


	set_settings: function(settings) {
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var transaction = db.transaction('settings', 'readwrite');
			var object_store = transaction.objectStore('settings');

			var id = 0;
			var req = object_store.put(settings, id);
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				resolve(settings);
			};
		});
	},


	get_settings: function() {
		var db = this.db;

		return new Promise(function (resolve, reject) {
			var transaction = db.transaction('settings', 'readonly');
			var object_store = transaction.objectStore('settings');

			var req = object_store.get(0);
			req.onerror = function(e) {
				reject();
				log_error(e);
			};
			req.onsuccess = function(ev) {
				var settings = req.result || {};

				resolve(settings);
			};
		});
	},
}

