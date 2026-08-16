const rateLimit=require('express-rate-limit');

const rateLimiter=(maxRequest,time)=>{
	return rateLimit({
		max:maxRequest,
		windowMs:time,
		message:'To many request, please try again later',
		headers: true,
		standardHeaders: true,
		legacyHeaders: false
	})
}

module.exports={
	rateLimiter
};