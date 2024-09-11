const jwt = require('jsonwebtoken');
const JWT_KEY = process.env.JWT_KEY || 'your_secret_key';
exports.checkAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token,JWT_KEY);
        req.userData = decoded;
        console.log(req.userData);
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        });
    }
};

exports.authorize = (...roles) =>{
    return (req,res,next)=>{
        if(!roles.includes(req.userData.role)){
            return res.status(403).json({message :"Access denied"});
        }
        next();
    }
};