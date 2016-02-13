function CustomerForm(storage, el) {
	this.el = el;
	this.storage = storage;

	el.find('#save').click(this.save_customer.bind(this));
};

CustomerForm.prototype = {
	constructor: CustomerForm,

	set_customer: function(c) {
		this.customer = c;

		var el = this.el;
		el.find('input[name=forename]').val(c.forename);
		el.find('input[name=surname]').val(c.surname);
		el.find('input[name=street]').val(c.street);
		el.find('input[name=zip]').val(c.zip);
		el.find('input[name=city]').val(c.city);

		var gender;
		if (c.gender[0] === 'm') {
			gender = 'male';
		} else if (c.gender[0] === 'f') {
			gender = 'female';
		} else {
			gender = 'child';
		}
		el.find('input[name="gender"][value="'+gender+'"]').prop('checked', true);
	},

	save_customer: function(ev) {
		var el = this.el;

		var forename = el.find('input[name=forename]').val();
		var surname = el.find('input[name=surname]').val();
		var gender;
		if (el.find('input[name="gender"][value="male"]').prop('checked')) {
			gender = 'm';
		} else if (el.find('input[name="gender"][value="female"]').prop('checked')) {
			gender = 'f';
		} else {
			gender = 'c';
		}
		var street = el.find('input[name=street]').val();
		var zip = el.find('input[name=zip]').val();
		var city = el.find('input[name=city]').val();

		if (this.customer) {
			this.customer.forename = forename;
			this.customer.surname = surname;
			this.customer.gender = gender;
			this.customer.street = street;
			this.customer.zip = zip;
			this.customer.city = city;
		} else {
			this.customer = new Customer(undefined, forename, surname, gender, street, zip, city);
		}

		var res;
		if (this.customer.id) {
			res = this.storage.save_customer(this.customer);
		} else {
			res = this.storage.create_customer(this.customer);
		}

		return res.then(function() {
		}, function(err) {
			console.error(err);
			ev.preventDefault();
		});
	},
};

create_storage().then(function(storage) {
	$(document).ready(function() {
		var form = new CustomerForm(storage, $('form'));

		var getParameterByName = function (name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
			var results = regex.exec(location.search);
			return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		}

		var id = getParameterByName('id');
		if (id) {
			storage.get_customer(id).then(function(c) {
				form.set_customer(c);
			}, function(err) {
				console.error(err);
			});
		}
	});
});
