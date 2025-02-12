const mongoose = require('mongoose');

const userFeedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    }
});

const feedbackSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    userfeedback: [userFeedbackSchema] 
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
