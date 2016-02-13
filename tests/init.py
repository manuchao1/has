import unittest

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By


def fill_form(driver, form_data):
	for name, value in form_data.items():
		el = driver.find_element_by_name(name)
		el.clear()
		el.send_keys(value)

