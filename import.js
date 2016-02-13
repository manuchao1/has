create_storage().then(function(storage) {
	$(document).ready(function() {
		$('#start').click(function() {
			var customers = $('textarea#customers').val();
			var items = $('textarea#items').val();
			var bills = $('textarea#bills').val();
			var billing_items = $('textarea#billing_items').val();

			console.log(customers);
			console.log(items);

			var customers = JSON.parse(customers);
			var items = JSON.parse(items);
			var bills = JSON.parse(bills);
			var billing_items = JSON.parse(billing_items);

			console.log(customers);
			console.log(items);
			var promises = customers.map(function(c) {
				var gender;
				if (c.anrede == 'Frau') {
					gender = 'female';
				} else if (c.anrede == 'Herr') {
					gender = 'male';
				} else {
					gender = 'child';
				}
				var customer = new Customer(c.id, c.vorname, c.nachname, gender, c.strasse, c.plz, c.ort);
				console.log('creating customer', c.id);
				return storage.create_customer(customer);
			});
			Promise.all(promises).then(function() {
				/*var promises = items.map(function(i) {
					if (i.versteckt == 0) {
						var item = new Item(i.id, i.ziffer, i.beschreibung, (i.preis*100)|0);
						console.log('creating item', i.id);
						return storage.create_item(item);
					}
				});*/
				promises = [];
				
				Promise.all(promises).then(function() {
					var promises = bills.map(function(b) {
						var positions = billing_items.filter(function(i) { return i.rechnung == b.id }).map(function(i) {
							return {
								date: new Date(i.datum),
								number: i.ziffer,
								description: i.beschreibung,
								price: (i.preis*100)|0,
							};
						});
						var bill = new Bill(undefined, b.patient, b.diagnose, new Date(b.rechnungsdatum), '', false, false, positions);
						console.log(bill);
						storage.create_bill(bill);
//function Bill(id, customer_id, subject, date, correspondence, is_printed, is_paid, positions) {
					});
				});
			})
		})
	});
});

