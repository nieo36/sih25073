const rateLimit = require('express-rate-limit');

const rateLimiter = (maxRequest = 100, time = 15 * 60 * 1000) => {
	return rateLimit({
		max: maxRequest,
		windowMs: time,
		message: 'Too many requests, please try again later',
		headers: true,
		standardHeaders: true,
		legacyHeaders: false,
	});
};

module.exports = {
	rateLimiter
};