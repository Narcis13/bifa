const jwt =require('jsonwebtoken');

 module.exports.checkaut= (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, 'ROSES');
        req.userData = decoded;
        next()
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        });
    }
}