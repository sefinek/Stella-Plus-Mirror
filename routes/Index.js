const router = require('express').Router();

router.get('/', (req, res) => {
	res.send(`<h1>Stella Mod Plus - Mirror #${process.env.MIRROR_ID}</h1>`);
});

module.exports = router;