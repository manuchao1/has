function ItemListForm(el, item_list) {
	this.el = el;

	el.delegate('tbody tr', 'click', this.open_item.bind(this));
}


ItemListForm.prototype = {
	constructor: ItemListForm,

	append_item: function(item) {
		var tr = document.createElement('tr');
		tr = $(tr);
		tr.data('id', item.id);

		[item.number, item.description, formats.format_price_nice(item.price)].map(function(text) {
			var td = document.createElement('td');
			td.textContent = text;
			tr.append(td);
		});

		tr.appendTo(this.el.find('tbody'));

		return tr;
	},

	open_item: function(ev) {
		var tr = $(ev.target).parent();
		var id = tr.data('id');
		window.location.replace('item.html?id='+id);
	},
};

create_storage().then(function(storage) {
	$(document).ready(function() {
		storage.list_items().then(function(item_list) {
			var table = new ItemListForm($('table'));

			item_list.map(table.append_item.bind(table));
		}, function(err) {
			console.error(err);
		});
	});
});

