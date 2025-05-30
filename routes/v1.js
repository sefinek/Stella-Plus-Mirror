const router = require('express').Router();
const passport = require('passport');
const limiter = require('./scripts/v1/ratelimit.js');
const DownloadBenefitsController = require('../controllers/v1/launcher/DownloadBenefits.js');

router.get('/stella-mod-plus/benefits/download', limiter, passport.authenticate('mirror', { session: false }), DownloadBenefitsController);

router.head('/test/latency', (req, res) => {
	res.sendStatus(200);
});

module.exports = router;