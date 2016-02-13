from init import *
from test_customers import CustomerTests

class BillTests(unittest.TestCase):
	def setUp(self):
		self.driver = webdriver.Firefox()


	def create(self):
		CustomerTests().create(self.driver)

		driver = self.driver
		driver.get('localhost:8000/compiled/bill.html')
		WebDriverWait(driver, 10).until(EC.title_is('Rechnung'))

		fill_form(driver, {
			'billing_date':   '31.12.2015',
			'subject':        'Bruch',
			'correspondence': 'Hallo!',
		})

		select = Select(driver.find_element_by_name('customer'))
		select.select_by_visible_text('Hans Petersen')

		select = Select(driver.find_element_by_class_name('adder')
		                      .find_element_by_name('position'))
		select.select_by_visible_text('1.2 Äpfel (€ 0,99)')
		select = Select(driver.find_element_by_class_name('adder')
		                      .find_element_by_name('position'))
		select.select_by_visible_text('1.2 Äpfel (€ 0,99)')

		el = driver.find_element_by_id('save')
		el.click()
		WebDriverWait(driver, 10).until(EC.title_is('Rechnungen'))

		driver.find_element(By.XPATH, '//td[text()="31.12.2015"]')
		driver.find_element(By.XPATH, '//td[text()="€ 1,98"]')


	def test(self):
		self.create()


	def tearDown(self):
		self.driver.close()

