create_storage().then(function(storage) {
	$(document).ready(function() {
		$('#start').click(function() {
			var customers = JSON.parse($('texarea#customers').val());
			var items = JSON.parse($('texarea#items').val());

			console.log(customers);
			console.log(items);
		})
	});
});

