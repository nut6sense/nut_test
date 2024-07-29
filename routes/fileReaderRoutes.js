const express = require('express');
const router = express.Router();
const fileReader = require('../controllers/fileReader');

router.get('/fileReader', fileReader.fileReader);

module.exports = router;