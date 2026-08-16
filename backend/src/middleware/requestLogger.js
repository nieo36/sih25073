const requestLogger=(req,res,next)=>{
	const timeStamp=new Date().toISOString();
	const user=req.get('User-Agent');
	console.log(timeStamp,user,req.ip,req.url,req.method);
	next();
}

module.exports={
	requestLogger
};