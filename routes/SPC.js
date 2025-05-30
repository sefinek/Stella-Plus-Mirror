const router = require('express').Router();
const { param } = require('express-validator');
const DownloadBenefitsController = require('../controllers/SPC/DownloadBenefits.js');

router.get('/benefits/stella-mod-plus/receive/:userId/:webToken/download', [
	param('userId')
		.notEmpty()
		.isString()
		.isLength({ min: 64, max: 64 }),
	param('webToken')
		.notEmpty()
		.isString()
		.isLength({ min: 256, max: 256 }),
], DownloadBenefitsController.download);

module.exports = router;