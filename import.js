create_storage().then(function(storage) {
	$(document).ready(function() {
		$('#start').click(function() {
			var customers = $('texarea#customers').val();
			var items = $('texarea#items').val();

			console.log(customers);
			console.log(items);

			var customers = JSON.parse(customers);
			var items = JSON.parse(items);

			console.log(customers);
			console.log(items);
		})
	});
});

