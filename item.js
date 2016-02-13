function ItemForm(storage, el) {
	this.el = el;
	this.storage = storage;

	el.find('#save').click(this.save_item.bind(this));
	el.delegate('input[name=price]', 'change', this.price_change.bind(this));
};

ItemForm.prototype = {
	constructor: ItemForm,

	set_item: function(item) {
		this.item = item;

		var el = this.el;
		el.find('input[name=number]').val(item.number);
		el.find('input[name=description]').val(item.description);

		var price = formats.format_price_edit(item.price);
		el.find('input[name=price]').val(price);
	},

	save_item: function(ev) {
		var el = this.el;

		var number = el.find('input[name=number]').val();
		var description = el.find('input[name=description]').val();
		var price_el = el.find('input[name=price]');
		var price = formats.parse_price(price_el.val());

		if (this.item) {
			this.item.number = number;
			this.item.description = description;
			this.item.price = price;
		} else {
			this.item = new Item(undefined, number, description, price);
		}

		var res;
		if (this.item.id) {
			res = this.storage.save_item(this.item);
		} else {
			res = this.storage.create_item(this.item);
		}

		return res.then(function() {
		}, function(err) {
			console.error(err);
			ev.preventDefault();
		});
	},

	price_change: function(ev) {
		var price_el = $(ev.target);

		var price = formats.parse_price(price_el.val());
		price_el.val(formats.format_price_edit(price));
	},
};

create_storage().then(function(storage) {
	$(document).ready(function() {
		var form = new ItemForm(storage, $('form'));

		var getParameterByName = function (name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
			var results = regex.exec(location.search);
			return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		}

		var id = getParameterByName('id');
		if (id) {
			storage.get_item(id).then(function(c) {
				form.set_item(c);
			}, function(err) {
				console.error(err);
			});
		}
	});
});
