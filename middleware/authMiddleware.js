// const jwt = require('jsonwebtoken');

// const verifyToken = (req, res, next) => {
//     const token = req.header('Authorization')?.split(' ')[1];

//     if (!token) return res.status(401).json('Access Denied');

//     try {
//         const verified = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = verified;
//         next();
//     } catch (err) {
//         res.status(400).json('Invalid Token');
//     }
// };

// module.exports = verifyToken;

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        console.error('Token verification failed:', ex.message);
        res.status(400).json({ error: 'Invalid token.' });
    }
};

module.exports = { generateToken, verifyToken };