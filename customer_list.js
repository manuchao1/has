function CustomerListForm(el, customer_list) {
	this.el = el;

	el.delegate('tbody tr', 'click', this.open_customer.bind(this));
}


CustomerListForm.prototype = {
	constructor: CustomerListForm,

	append_customer: function(c) {
		var tr = document.createElement('tr');
		tr = $(tr);
		tr.data('id', c.id);

		[c.surname, c.forename, c.zip, c.city].map(function(text) {
			var td = document.createElement('td');
			td.textContent = text;
			tr.append(td);
		});

		tr.appendTo(this.el.find('tbody'));

		return tr;
	},

	open_customer: function(ev) {
		var tr = $(ev.target).parent();
		var id = tr.data('id');
		window.location.replace('customer.html?id='+id);
	},
};


create_storage().then(function(storage) {
	$(document).ready(function() {
		var table = new CustomerListForm($('table'));

		storage.list_customers().then(function(customer_list) {
			customer_list.map(table.append_customer.bind(table));
		}, function() {console.error(this, arguments)});
	});
});

