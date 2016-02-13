function BillListForm(el, bill_list) {
	this.el = el;

	el.delegate('tbody tr', 'click', this.open_bill.bind(this));
}


BillListForm.prototype = {
	constructor: BillListForm,

	append_bill: function(b) {
		var tr = document.createElement('tr');
		tr = $(tr);
		tr.data('id', b.id);

		[b.id, formats.format_date_edit(b.date),
		 b.customer.forename, b.customer.surname,
		 formats.format_price_nice(b.total()),
		 b.is_printed ? 'Ja' : 'Nein',
		 b.is_paid ? 'Ja' : 'Nein',
		 ].map(function(text) {
			var td = document.createElement('td');
			td.textContent = text;
			tr.append(td);
		});

		tr.appendTo(this.el.find('tbody'));

		return tr;
	},

	open_bill: function(ev) {
		var tr = $(ev.target).parent();
		var id = tr.data('id');
		window.location.replace('bill.html?id='+id);
	},
};


create_storage().then(function(storage) {
	$(document).ready(function() {
		storage.list_bills({join: true}).then(function(bill_list) {
			var table = new BillListForm($('table'));

			bill_list.map(table.append_bill.bind(table));
		});
	});
});

