const express = require('express');
const router = express.Router();
const fileReader = require('../controllers/fileReader');

router.get('/fileReader', fileReader.fileReader);
router.get('/zipFolder', fileReader.zipFolder);
router.get('/insertAllWord', fileReader.insertAllWord);

module.exports = router;