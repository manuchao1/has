create_storage().then(function(storage) {
	storage.unprinted_bill_count().then(function(count) {
		$(document).ready(function() {
			var print_el = $('.nav li.nav-item.print');
			print_el.click(function(ev) {print_bills(ev, storage, print_el)})
			     .find('.label').text(count).removeClass('invisible');
		});
	});
});

