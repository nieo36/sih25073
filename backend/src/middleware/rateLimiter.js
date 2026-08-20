const rateLimit = require('express-rate-limit');

const rateLimiter = (maxRequest = 5000, time = 15 * 60 * 1000) => {
	return rateLimit({
		max: maxRequest,
		windowMs: time,
		message: { message: 'Too many requests, please try again later' },
		headers: true,
		standardHeaders: true,
		legacyHeaders: false,
		skip: () => process.env.NODE_ENV !== 'production', // Skip in development
	});
};

module.exports = {
	rateLimiter,
};