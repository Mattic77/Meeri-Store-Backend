const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const GetidfromToken = async(req)=>{

try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new Error('Authorization header missing');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new Error('Token missing');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            throw new Error('Invalid token');
        }

        const user = await User.findById(decoded.user_id); // Ensure the token contains `id`
        if (!user) {
            throw new Error('User not found');
        }

     
        return user; // Return the user object for further use if needed
    } catch (error) {
        // Throw error to be handled by the route
        throw new Error(error.message);
    }
}
const verifyTokenAdmin = async (req) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new Error('Authorization header missing');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new Error('Token missing');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            throw new Error('Invalid token');
        }

        const user = await User.findById(decoded.user_id); // Ensure the token contains `id`
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.isAdmin) {
            throw new Error('You are not authorized to create products');
        }

        return user; // Return the user object for further use if needed
    } catch (error) {
        // Throw error to be handled by the route
        throw new Error(error.message);
    }
};
const verifyTokenModerator = async (req) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new Error('Authorization header missing');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new Error('Token missing');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            throw new Error('Invalid token');
        }

        const user = await User.findById(decoded.user_id); // Ensure the token contains `id`
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.isAdmin && !user.isModerator) {
            throw new Error('You are not authorized to create products');
        }

        return user; // Return the user object for further use if needed
    } catch (error) {
        // Throw error to be handled by the route
        throw new Error(error.message);
    }
};

module.exports = {verifyTokenAdmin,verifyTokenModerator,GetidfromToken};