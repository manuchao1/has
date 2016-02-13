function SettingsForm(storage, el, settings) {
	this.el = el;
	this.storage = storage;

	this.set_settings(settings);
	el.find('#save').click(this.save.bind(this));
}


SettingsForm.prototype = {
	constructor: SettingsForm,

	save: function(ev) {
		var el = this.el;

		var name_list = [
			'name',
			'street',
			'city',
			'phone',
			'fax',
			'email',
			'greeting',
			'signature',
			'retour_address',
			'bank',
			'blz',
			'account',
		];

		var settings = {};
		for (var i in name_list) {
			var name = name_list[i];
			var val = el.find('input[name='+name+']').val();
			settings[name] = val;
		}

		this.storage.set_settings(settings).then(function() {
		}, function(err) {
			console.error(err);
			ev.preventDefault();
		});
	},

	set_settings: function(settings) {
		for (var name in settings) {
			var el = this.el.find('input[name='+name+']');
			el.val(settings[name]);
		}
	},
};

create_storage().then(function(storage) {
	$(document).ready(function() {
		storage.get_settings().then(function(settings) {
			var form = new SettingsForm(storage, $('form'), settings);
		}, function(err) {
			console.error(err);
		});
	});
});

