const jwt = require('jsonwebtoken');
const User = require('../models/User');

const extractAndVerifyToken = (req) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) throw new Error('Authorization header missing');
    const token = authHeader.split(' ')[1];
    if (!token) throw new Error('Token missing');
    return jwt.verify(token, process.env.JWT_SECRET);
};

const getUserFromToken = async (decoded) => {
    const user = await User.findById(decoded.user_id);
    if (!user) throw new Error('User not found');
    return user;
};

const verifyRole = (user, roles) => {
    if (!roles.some((role) => user[role])) {
        throw new Error('You are not authorized to perform this action');
    }
};

const GetidfromToken = async (req) => {
    try {
        const decoded = extractAndVerifyToken(req);
        return await getUserFromToken(decoded);
    } catch (error) {
        throw new Error('Authentication failed');
    }
};

const verifyTokenAdmin = async (req) => {
    try {
        const decoded = extractAndVerifyToken(req);
        const user = await getUserFromToken(decoded);
        verifyRole(user, ['isAdmin']);
        return user;
    } catch (error) {
        throw new Error('Admin authentication failed');
    }
};

const verifyTokenModerator = async (req) => {
    try {
        const decoded = extractAndVerifyToken(req);
        const user = await getUserFromToken(decoded);
        verifyRole(user, ['isAdmin', 'isModerator']);
        return user;
    } catch (error) {
        throw new Error('Moderator authentication failed');
    }
};

module.exports = { verifyTokenAdmin, verifyTokenModerator, GetidfromToken };
