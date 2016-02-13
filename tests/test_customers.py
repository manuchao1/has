from init import *

class CustomerTests(unittest.TestCase):
	def setUp(self):
		self.driver = webdriver.Firefox()

	@staticmethod
	def create(driver):
		driver.get('localhost:8000/compiled/customer.html')
		WebDriverWait(driver, 10).until(EC.title_is('Patienten'))

		fill_form(driver, {
			'forename': 'Hans',
			'surname':  'Petersen',
			'street':   'Hansestraße 234',
			'zip':      '23535',
			'city':     'Dortmund',
		})

		el = driver.find_element_by_id('save')
		el.click()
		WebDriverWait(driver, 10).until(EC.title_is('Kunden'))

		driver.find_element(By.XPATH, '//td[text()="Hans"]')
		driver.find_element(By.XPATH, '//td[text()="Petersen"]')


	def modify(self):
		driver = self.driver
		driver.get('http://localhost:8000/compiled/customer_list.html')
		WebDriverWait(driver, 10).until(EC.title_is('Kunden'))

		el = driver.find_element(By.XPATH, '//td[text()="Hans"]')
		el.click()
		WebDriverWait(driver, 10).until(EC.title_is('Patienten'))

		fill_form(driver, {
			'forename': 'Klaus',
			'surname':  'Ströger',
			'street':   'Hansestraße 1',
			'zip':      '34328',
			'city':     'München',
		})

		el = driver.find_element_by_id('save')
		el.click()
		WebDriverWait(driver, 10).until(EC.title_is('Kunden'))

		driver.find_element(By.XPATH, '//td[text()="Klaus"]')
		driver.find_element(By.XPATH, '//td[text()="Ströger"]')
		driver.find_element(By.XPATH, '//td[text()="34328"]')
		driver.find_element(By.XPATH, '//td[text()="München"]')


	def test(self):
		self.create(self.driver)
		self.modify()


	def tearDown(self):
		self.driver.close()

