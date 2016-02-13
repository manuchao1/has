function BillForm(storage, el, customer_list, item_list) {
	this.el = el;
	this.storage = storage;
	this.bill = new Bill(undefined, undefined, '', new Date(), '', false, false, []);

	el.find('#save').click(this.save_bill.bind(this));

	var customer_el = el.find('select[name=customer]');
	//customer_el.select2();
	customer_list.map(function(c) {
		var option_el = document.createElement('option');
		option_el.textContent = c.name();
		option_el.setAttribute('value', c.id);

		customer_el.append(option_el);
	});

	var position_el_list = el.find('select[name=position]');
	item_list.map(function(item) {
		var option_el = $(document.createElement('option'));
		option_el.text(item.name());
		option_el.attr('value', item.id);
		option_el.data('item', item);

		position_el_list.append(option_el);
	});

	el.delegate('select[name=position]', 'change', (function(ev) {
		var option_el = $(ev.target).find('option:selected');
		var row_el = option_el.parents('.form-group.row')
		var all_rows = row_el.parent().children();

		if (option_el.val() === '') {
			row_el.hide({
				duration: 'slow',
				complete: row_el.remove.bind(row_el),
			});

			var i = all_rows.index(row_el);
			if (!row_el.hasClass('adder')) {
				this.bill.positions.splice(i, 1); // delete
			}
		} else {
			var price = formats.format_price_edit(option_el.data('item').price);
			row_el.find('input[name=price]').val(price);
		}

		if (row_el.hasClass('adder')) {
			var item = JSON.parse(JSON.stringify(option_el.data('item')));
			console.log(item);
			item.date = row_el.find('input[name=position_date]').val()
			item.date = formats.parse_date(item.date) || new Date();

			this.bill.positions.push(item);		

			this.add_position(item);
			row_el.find('select[name=position]').val('');
			row_el.find('input[name=position_date]').val('');
			row_el.find('input[name=price]').val('');
		}

		this.update_total(this.bill.total());
	}).bind(this));

	el.delegate('input[name=price]', 'change', this.price_change.bind(this));
	el.delegate('input[type=date]', 'focusin', this.date_focusin.bind(this));
};


BillForm.prototype = {
	constructor: BillForm,

	save_bill: function(ev) {
		var self = this;
		var el = this.el;

		var customer_id = el.find('select[name=customer]').val();
		var date = formats.parse_date(el.find('input[name=billing_date]').val());
		var subject = el.find('input[name=subject]').val();
		var correspondence = el.find('textarea[name=correspondence]').val();
		var is_printed = el.find('input[name=is_printed]').prop('checked');
		var is_paid = el.find('input[name=is_paid]').prop('checked');

		if (this.bill.id) {
			this.bill.customer_id = parseInt(customer_id);
			this.bill.date = date;
			this.bill.subject = subject;
			this.bill.correspondence = correspondence;
			this.bill.is_printed = is_printed;
			this.bill.is_paid = is_paid;
			delete this.bill.customer;
		} else {
			this.bill = new Bill(undefined, customer_id, subject, date,
				correspondence, is_printed, is_paid, this.bill.positions);
		}

		var res;
		if (this.bill.id) {
			res = this.storage.save_bill(this.bill);
		} else {
			res = this.storage.create_bill(this.bill);
		}

		res.then(function() {
		}, function(err) {
			console.error(err, self.bill);
			ev.preventDefault();
		});
	},

	set_bill: function(b) {
		this.bill = b;
		
		var el = this.el;
		el.find('select[name=customer]').val(b.customer_id);
		el.find('input[name=billing_date]').val(formats.format_date_edit(b.date));
		el.find('input[name=subject]').val(b.subject);
		el.find('textarea[name=correspondence]').val(b.correspondence);
		el.find('input[name=is_printed]').prop('checked', b.is_printed);
		el.find('input[name=is_paid]').prop('checked', b.is_paid);

		var positions_el = el.find('.positions');
		positions_el.find('> :not(.adder)').remove();
		
		b.positions.map(this.add_position.bind(this));
		this.update_total(b.total());
	},

	add_position: function(p) {
		var el = this.el;
		var template = el.find('.adder');

		var with_data_and_events = true;
		var pos_el = template.clone(with_data_and_events);
		pos_el.removeClass('adder');
		template.before(pos_el);

		var date  = formats.format_date_edit(p.date);
		var price = formats.format_price_edit(p.price);

		pos_el.find('input[name=position_date]').val(date);
		pos_el.find('select[name=position]').val(p.id);
		pos_el.find('input[name=price]').val(price);
	},

	date_focusin: function(ev) {
		var date_el = $(ev.target);
		var date = formats.parse_date(date_el.val());
		date_el.val(formats.format_date_edit(date));
	},

	price_change: function(ev) {
		var price_el = $(ev.target);
		var i = this.el.find('.positions input[name=price]').index(price_el);

		var price = formats.parse_price(price_el.val());
		price_el.val(formats.format_price_edit(price));
		this.bill.positions[i].price = price;

		if (!isNaN(price)) {
			price_el.parents('.form-group').removeClass('has-danger');
			price_el.removeClass('form-control-danger');
		} else {
			price_el.parents('.form-group').addClass('has-danger');
			price_el.addClass('form-control-danger');
		}

		console.log(price);
		this.update_total(this.bill.total());
	},

	update_total: function(new_total) {
		this.el.find('#total').text(formats.format_price_nice(new_total));
	},
};

create_storage().then(function(storage) {
	$(document).ready(function () {
		var getParameterByName = function (name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
			var results = regex.exec(location.search);
			return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		}
		var id = getParameterByName('id');

		Promise.all([
			storage.list_customers(),
			storage.list_items(),
		]).then(function(results) {
			var customer_list = results[0];
			var item_list = results[1];

			var form = new BillForm(storage, $('form'), customer_list, item_list);

			if (id) {
				storage.get_bill(id).then(function(bill) {
					form.set_bill(bill);
				}, function(err) {
					console.error(err);
				})
			}
		});
	});
});

