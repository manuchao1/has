var log_error = function(err) {
	console.error(err);
}

RemoteStorage.defineModule('bills', function(private_client, public_client) {
	private_client.declareType('customers', {
		description: 'A customer',
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
			},
			forename: { type: 'string' },
			surname:  { type: 'string' },
			gender:   { type: 'string' },
			street:   { type: 'string' },
			zip:      { type: 'string' },
			city:     { type: 'string' },
		},
	});
	private_client.declareType('bills', {
		description: 'A bill',
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
			},
			customer_id:    { type: 'string'  },
			billing_date:   { type: 'date'  },
			subject:        { type: 'string' },
			correspondence: { type: 'string' },
			is_printed:     { type: 'boolean' },
			positions: {
				type: 'array',
				items: {
					date:     { type: 'date' },
					position: { type: 'string' },
					price:    { type: 'integer' },
				},
			},
		},
	});
	private_client.declareType('items', {
		description: 'An item you can copy to a bill',
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'id',
			},
			number:      { type: 'string'  },
			description: { type: 'string'  },
			price:       { type: 'integer' },
		},
	});

	var db = {
		convert_customer: function(c) {
			return new Customer(c.id, c.forename, c.surname, c.gender, c.street, c.zip, c.city);
		},

		convert_bill: function(b) {
			var positions = b.positions.map(function(pos) {
				pos.date = new Date(pos.date);
				return pos;
			})
			return new Bill(b.id, b.customer_id, b.subject, new Date(b.date), b.correspondence, b.is_printed, positions);
		},

		convert_item: function(i) {
			return new Item(i.id, i.number, i.description, i.price);
		},
	};

	return {
		exports: {
			create_customer: function(customer) {
				var id = (Math.random()*1000)|0;
				customer.id = '/customers/'+customer.forename+'-'+customer.surname+'-'+id;
				return this.save_customer(customer);
			},

			save_customer: function(customer) {
				return private_client.storeObject('customers', customer.id, customer);
			},

			get_customer: function(id) {
				var max_age = false;
				return private_client.getObject(id, max_age).then(db.convert_customer, log_error);
			},

			list_customers: function(options) {
				var max_age = false;
				var res = private_client.getAll('/customers/', max_age)
				res = res.then(function(customer_list) {
					var result = [];
					for (var id in customer_list) {
						result.push(customer_list[id]);
					}
					return result.map(db.convert_customer);
				}, log_error);
				
				return res;
			},

			create_bill: function(bill) {
				var id = (Math.random()*1000)|0;
				bill.id = bill.customer_id+'/bills/'+bill.date.toISOString()+'-'+id;
				return this.save_bill(bill);
			},

			save_bill: function(bill) {
				if (!bill.id.includes(bill.customer_id)) {
					console.error('you are changing the customer of a bill! This behaviour is currently unimplemented!');
				}
				return private_client.storeObject('bills', bill.id, bill);
			},

			get_bill: function(id) {
				var max_age = false;
				return private_client.getObject(id, max_age).then(db.convert_bill, log_error);
			},

			list_bills_for_customer: function(customer_id, options) {
				// does not JOIN bills and customer!
				var max_age = false;

				var path = '/customers/'+customer_id+'/bills/';
				var res = private_client.getAll(path, max_age);
				res = res.then(function(bill_list) {
					var result = [];
					for (var id in bill_list) {
						result.push(bill_list[id]);
					}
					return result.map(db.convert_bill);
				}, log_error);
				
				return res;
			},

			list_customer_ids: function() {
				return private_client.getListing('/customers/', false).then(R.keys);
			},

			list_bills: function(options) {
				// does not JOIN bills and customers!
				var self = this;
				var promise = this.list_customer_ids();
				promise = promise.then(function (customer_list) {
					var customer_promise_list = [];

					for (var i in customer_list) {
						var customer_id = customer_list[i];
						var promise = self.list_bills_for_customer(customer_id);
						customer_promise_list.push(promise);
					}

					return customer_promise_list;
				}, log_error)
				.then(Promise.all, log_error)
				.then(R.flatten, log_error);

				if (!options || !options.join) {
					return promise;
				}

				var bill_list;
				return promise.then(function (_bill_list) {
					bill_list = _bill_list;
					var customer_id_list = R.uniq(R.pluck('customer_id', bill_list));
					return customer_id_list.map(self.get_customer);
				}, log_error)
				.then(Promise.all, log_error)
				.then(function (customer_list) {
					var customers = R.zipObj(R.pluck('id', customer_list), customer_list);

					for (var i = 0; i < bill_list.length; i++) {
						bill_list[i].customer = customers[bill_list[i].customer_id];
					}

					return bill_list;
				});
			},

			create_item: function(item) {
				var id = (Math.random()*1000)|0;
				item.id = '/items/'+item.number+'-'+item.description+'-'+id;
				return this.save_item(item);
			},

			save_item: function(item) {
				return private_client.storeObject('items', item.id, item);
			},

			list_items: function(options) {
				var max_age = false;
				var res = private_client.getAll('/items/', max_age);
				res = res.then(function(item_list) {
					var result = [];
					for (var id in item_list) {
						result.push(item_list[id]);
					}
					return result.map(db.convert_item);

				}, log_error);
				
				return res;
			},
		}
	};
});

