function Bill(id, customer_id, subject, date, correspondence, is_printed, is_paid, positions) {
	this.id = id;
	this.customer_id = customer_id;
	this.subject = subject;
	this.date = date;
	this.correspondence = correspondence;
	this.is_printed = is_printed; // bool
	this.is_paid = is_paid; // bool
	this.positions = positions;
};

Bill.prototype = {
	constructor: Bill,

	total: function() {
		return this.positions.reduce(function(a,b) {
			return a + (b.price | 0);
		}, 0);
	},
};

function Item(id, number, description, price) {
	this.id = id;
	this.number = number;
	this.description = description;
	this.price = price;
};

Item.prototype = {
	constructor: Item,

	name: function() {
		return this.number + ' ' + this.description +
			' (' + formats.format_price_nice(this.price) + ')';
	},
};

function Customer(id, forename, surname, gender, street, zip, city) {
	this.id = id;
	this.forename = forename;
	this.surname = surname;
	this.gender = gender; // m[ale], f[emale], or c[hild]
	this.street = street;
	this.zip = zip;
	this.city = city;

	this.address = this.address.bind(this);
};

Customer.prototype = {
	constructor: Customer,

	name: function() {
		return this.forename + ' ' + this.surname;
	},

	address: function() {
		return this.name()+'\n' +
			this.street+'\n' +
			this.zip + ' ' + this.city;
	},
};

var formats = {
	parse_price: function(str) {
		// converts '1.100,00' to 110000
		// returns number in cents
		// returns NaN if str cannot be parsed
		if (!str.includes(',')) {
			str += ',00'
		}
		return parseInt(str.replace('€', '')
		                   .replace(',', '')
				   .replace('.', ''));
	},

	format_price_nice: function(val) {
		// converts 110000 to '€ 1100,00'
		var str = '€ ';
		str += (val/100 | 0);

		var cents = (val % 100);
		if (cents < 10) {
			cents = '0'+cents;
		}
		str += ',' + cents;

		return str;
	},

	format_price_edit: function(val) {
		// converts 110000 to '1100,00'
		val = val|0;
		var str = '' + (val/100 | 0);

		var cents = (val % 100);
		if (cents < 10) {
			cents = '0'+cents;
		}
		str += ',' + cents;

		return str;
	},

	parse_date: function(str) {
		var re = /([0-9]{2}).([0-9]{2}).([0-9]{2,4})/;
		var m = str.match(re);

		if (m) {
			var val = new Date(m[3], m[2]-1, m[1]);
			return val;
		} else {
			return new Date();
		}
	},

	format_date_nice: function(date) {
		// 'Sa., 02.01.2016'
		var options = { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' };
		return date.toLocaleDateString(undefined, options);
	},

	format_date_edit: function(date) {
		// '02.01.2016'
		var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
		return date.toLocaleDateString(undefined, options);
	},
};

