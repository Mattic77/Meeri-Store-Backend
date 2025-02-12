const User = require('../models/User');
const { Product} = require('../models/Product');
const  Feedback  = require('../models/Feedback');
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const mongoose = require('mongoose'); 
const dotenv = require('dotenv');
dotenv.config();

const resolvers = {
    ADDfeedback: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req); // Validate the user from token
            const { product, userfeedback } = args.input; // Extract input
    
            // Check if the product exists
            const producexist = await Product.findById(product);
            if (!producexist) {
                return { message: 'Product not found' };
            }
    
            // Check if feedback already exists for the product
            let feedback = await Feedback.findOne({ product });
    
            const feedbackData = {
                user: user._id,
                comment: userfeedback.comment,
                rating: userfeedback.rating
            };
    
            if (feedback) {
                // Add the new feedback to the existing feedback document
                console.log("alredy exist" )
                feedback.userfeedback.push(feedbackData);
            } else {
                // Create a new feedback document if it doesn't exist
                feedback = new Feedback({
                    product,
                    userfeedback: [feedbackData] // Ensure it's an array
                });
            }
    
            // Save feedback
            await feedback.save();
            return { message: 'Feedback added successfully' };
        } catch (err) {
            console.error('Error in adding feedback', err.message);
            return { message: `Error: ${err.message}` };
        }
    }
};
    
module.exports = resolvers;
