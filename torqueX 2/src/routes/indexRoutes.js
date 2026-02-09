const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// Home page
router.get('/', indexController.getHomePage);

// About page
router.get('/about', indexController.getAboutPage);

// Contact page
router.get('/contact', indexController.getContactPage);
router.post('/contact', indexController.submitContactForm);

module.exports = router;