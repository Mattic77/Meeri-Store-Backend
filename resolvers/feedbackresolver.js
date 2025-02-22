const User = require('../models/User');
const { Product} = require('../models/Product');
const  Feedback  = require('../models/Feedback');
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const mongoose = require('mongoose'); 
const dotenv = require('dotenv');
dotenv.config();

const resolvers = {
    feedbackGET: async(args,context)=>{
        try {
            const feedbackList = await Feedback.find() 
            .populate({
                path: 'product',
                model: 'Product',
                select: '_id name description Price category images', // Only retrieve relevant fields
                    }).populate({
                        path: 'userfeedback.user', 
                        model: 'User', 
                        select: 'username', 
                    });
                    if(!feedbackList){
                        return { message: 'No feedbacks found' };
                    }
                    return feedbackList;
        }catch(error){
            console.error(error);
            return { message: 'Error Getiing feedbacks' };
        }
    },
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
                // Check if the user already provided feedback
                const existingFeedback = feedback.userfeedback.find(
                    (fb) => fb.user.toString() === user._id.toString()
                );
    
                if (existingFeedback) {
                    return { message: 'User has already provided feedback for this product' };
                }
    
                // Add the new feedback
                feedback.userfeedback.push(feedbackData);
            } else {
                // Create a new feedback document if it doesn't exist
                feedback = new Feedback({
                    product,
                    userfeedback: [feedbackData] // Ensure it's an array
                });
            }
    
            await feedback.save();
            return { message: 'Feedback added successfully' };
        } catch (error) {
            console.error(error);
            return { message: 'Error adding feedback' };
        }
    },
    
    feedbackproductGET : async (args,context )=>{
        try {
            const feedback = await Feedback.findOne({ product: args._id }).populate({
        path: 'product',
        model: 'Product',
        select: '_id name description Price category images', // Only retrieve relevant fields
            }).populate({
                path: 'userfeedback.user', 
                model: 'User', 
                select: 'username', 
            });
            console.log(feedback)
            return  feedback ;
        } catch (error) {
            console.error('Error in fetching feedback', error.message);
            return { message: `Error: ${error.message}` };
        }
    },
    DELETEfeedback: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req); // Extract user information from token
            const { product } = args.input; // Extract product ID from input
    
            // Find the feedback document for the specified product
            const feedback = await Feedback.findOne({ product });
            if (!feedback) {
                return { message: "Product feedback not found" };
            }
    
            // Check if the user has provided feedback for the product
            const userFeedback = feedback.userfeedback.find(
                (uf) => uf.user.toString() === user._id.toString()
            );
            if (!userFeedback) {
                return { message: "User feedback not found" };
            }
    
            // Remove the specific user feedback
            await Feedback.findOneAndUpdate(
                { product },
                { $pull: { userfeedback: { user: user._id } } }, // Remove feedback based on the user's ID
                { new: true }
            );
    
            return { message: "User feedback deleted successfully" };
        } catch (err) {
            console.error("Error in deleting user feedback:", err.message);
            return { message: `Error: ${err.message}` };
        }
    },
    
    DELETEfeedbackAdmin: async (args, context) => {
        try {
            const admin = await verifyTokenModerator(context.req); // Extract admin information from token
    

  
            const { product, userId } = args.input; // Extract product ID and user ID (or another identifier)
    
            // Find the feedback document for the given product
            const feedback = await Feedback.findOne({ product });
    
            if (!feedback) {
                return { message: "Feedback for the product not found." };
            }
    
            // Find the index of the user feedback to delete
            const feedbackIndex = feedback.userfeedback.findIndex(
                (uf) => uf.user.toString() === userId
            );
    
            if (feedbackIndex === -1) {
                return { message: "User feedback not found." };
            }
    
            // Remove the specific user feedback
            feedback.userfeedback.splice(feedbackIndex, 1);
    
            // Save the updated feedback document
            await feedback.save();
    
            return { message: "User feedback deleted successfully by admin." };
        } catch (err) {
            console.error("Error in DELETEfeedbackAdmin:", err.message);
            return { message: `Error: ${err.message}` };
        }
    },
    
    
};
    
module.exports = resolvers;
