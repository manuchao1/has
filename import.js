create_storage().then(function(storage) {
	$(document).ready(function() {
		$('#start').click(function() {
			var customers = $('textarea#customers').val();
			var items = $('textarea#items').val();

			console.log(customers);
			console.log(items);

			var customers = JSON.parse(customers);
			var items = JSON.parse(items);

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
				var promises = items.map(function(i) {
					if (i.versteckt == 0) {
						var item = new Item(i.id, i.ziffer, i.beschreibung, i.preis);
						console.log('creating item', i.id);
						return storage.create_item(item);
					}
				});
			})
		})
	});
});

