/*
Vorname weg in anrede,
Sehr geehrte Familie XXX, bei Kinder
option: Frau, Herr, Kind

payed?
*/

var tex_escape = function(str) {
	if (str === undefined) {
		return '';
	} else {
		console.log(str);
		return str.replace(/\n/g, '\\\\')
			.replace('€', '\\euro');
			.replace('·', '\\textperiodcentered');

	}
}

var format_latex = function(bill, settings) {
/* für g-brief2
	var mappings = {
		'settings.name':  'Name',
		'settings.name1': 'NameZeileA',
		'settings.name2': 'NameZeileB',
		'settings.name3': 'NameZeileC',
		'settings.name4': 'NameZeileD',
		'settings.name5': 'NameZeileE',
		'settings.name6': 'NameZeileF',
		'settings.name7': 'NameZeileG',
		'settings.address1': 'AdressZeileA',
		'settings.address2': 'AdressZeileB',
		'settings.address3': 'AdressZeileC',
		'settings.address4': 'AdressZeileD',
		'settings.address5': 'AdressZeileE',
		'settings.address6': 'AdressZeileF',

		'settings.phone1': 'TelefonZeileA',
		'settings.phone2': 'TelefonZeileB',
		'settings.phone3': 'TelefonZeileC',
		'settings.phone4': 'TelefonZeileD',
		'settings.phone5': 'TelefonZeileE',
		'settings.phone6': 'TelefonZeileF',

		'settings.internet1': 'InternetZeileA',
		'settings.internet2': 'InternetZeileB',
		'settings.internet3': 'InternetZeileC',
		'settings.internet4': 'InternetZeileD',
		'settings.internet5': 'InternetZeileE',
		'settings.internet6': 'InternetZeileF',

		'settings.bank1': 'BankZeileA',
		'settings.bank2': 'BankZeileB',
		'settings.bank3': 'BankZeileC',
		'settings.bank4': 'BankZeileD',
		'settings.bank5': 'BankZeileE',
		'settings.bank6': 'BankZeileF',

		'settings.retour_address': 'RetourAdresse',
		'bill.customer.address':   'Adresse',
		'bill.date':               'Datum',
		'settings.signature':      'Unterschrift',

		// These must be at the correct position in tex which is done manually
		//'bill.subject':            'Betreff',
		//'bill.correspondence':     'Anrede',
		//'bill.greeting':           'Gruss',
/*
\MeinZeichen{ }
\Gruss{ }{1.5cm}

\Unterschrift{ }
\Anlagen{ }
\Verteiler{ }

\unserzeichen
\trennlinien
\lochermarke
\faltmarken
	};
*/
	var mappings = {
		'settings.name':           'Name',
		'settings.street':         'Strasse',
		'settings.city':           'Ort',
		'settings.phone':          'Telefon',
		'settings.fax':            'Telefax',
		'settings.email':          'EMail',
		'settings.signature':      'Unterschrift',
		'settings.retour_address': 'RetourAdresse',

		'settings.bank':           'Bank',
		'settings.blz':            'BLZ',
		'settings.account':        'Konto',

		'bill.customer.address':   'Adresse',
		'bill.date':               'Datum',
	};

	console.log('!!settings!!', settings);
	var scope = {
		'settings': settings,
		'bill': bill,
	};
	scope.bill.date = formats.format_date_nice(scope.bill.date);

	console.log(bill.subject);
	var replace = function(value, key) {	
		var tex_val = R.path(key.split('.'), scope) || '';
		var tex_cmd = value;
		if (typeof(tex_val) === 'function') {
			tex_val = tex_val();
		}
		console.log(tex_cmd, tex_val);
		return '\\'+tex_cmd+'{'+tex_escape(tex_val)+'}';
	};

	var preamble = R.mapObjIndexed(replace, mappings);

	var position_to_row = function(pos) {
		return formats.format_date_nice(pos.date) +
			' & ' + tex_escape(pos.number) +
			' & ' + tex_escape(pos.description) +
			' & ' + tex_escape(formats.format_price_nice(pos.price)) +
			' \\\\';
	};

	var total = tex_escape(formats.format_price_nice(bill.total()))
	var table = '\\begin{tabular}{r r l r}\n' +
		'Datum & Ziffer & Beschreibung & Preis \\\\\n' +
		scope.bill.positions.map(position_to_row).join('\n') + '\n' +
		'\\hline\n' +
		'&  & Summe & ' + total + ' \\\\\n' +
		'\\end{tabular}\n';

	var text = '\\medskip für die Behandlung im Zeitraum {} -- {} berechne ich Ihnen den Betrag von {}.\\\\\n' +
		'\\medskip Diagnose(n): {}\\\\\\\\\n' +
		'Nach der Gebührenordnung für Heilpraktiker:\\\\\n';

	return '\n' +
		'\\documentclass[a4paper,11pt,latin1]{g-brief}\n'+
		'\\usepackage[ngerman]{babel}\n' +
		'\\usepackage[utf8x]{inputenc}\n' +
		'\\usepackage[T1]{fontenc}\n' +
		'\\fenstermarken\n' +
		R.values(preamble).join('\n')+'\n\n' +
		'\\Betreff{' + tex_escape(bill.subject) + '}\n' +
		'\\Anrede{' + tex_escape(bill.correspondence) + '}\n' +
		'\\Gruss{' + tex_escape(settings.greeting) + '}{1cm}\n' +
		'\n' +
		'\\begin{document}\n' +
		'\\begin{g-brief}\n' +
		text +
		'\\begin{center}\n' +
		table +
		'\\end{center}\n' +
		'\\end{g-brief}\n' +
		'\\end{document}\n';
}

var print_bills = function(ev, storage, print_el) {
	ev.preventDefault();

	print_el.find('.label').html('<i class="fa fa-spinner fa-spin" />');

	storage.get_settings().then(function(settings) {
		function print(bill) {
			// create pdf for single bill (if not already created)
			// ALWAYS returns a promise
			return storage.get_pdf(bill.id).then(function (pdf) {
				return [bill.id, pdf];
			}, new Promise(function (resolve, reject) {
				// is_pdf_created failed
				var pdftex = new PDFTeX('../texlive.js/pdftex-worker.js');
				var latex_code = format_latex(bill, settings);
				console.log(latex_code);

				pdftex.compile(latex_code)
				      .then(function(pdf) {
						storage.save_pdf(bill.id, pdf).then(function(pdf) {
							console.log(bill.id, 'pdf created');
							resolve([bill.id, pdf]);
						});
					});
			}));
		};

		storage.list_unprinted_bills().then(function(bill_list) {
			console.log('unprinted bills:', bill_list);

			var promise_list = bill_list.map(print);
			Promise.all(promise_list).then(function (pdf_list) {
				var pdftex = new PDFTeX('../texlive.js/pdftex-worker.js');
				
				pdf_list.map(function(args) {
					var bill_id = args[0];
					var pdf = args[1];
					pdftex.createCommand('FS_createDataFile', '/', bill_id, pdf, true, false);
				});
				
				// merge =>
				//  - get pdfs
				//  - put pdfs into filesystem
				//  - call pdftex
				// TODO: merge, then open
				/*window.open(pdf)
				storage.unprinted_bill_count().then(function(count) {
					print_el.find('.label').text(count);
				});*/
			})
		});
	});
};

