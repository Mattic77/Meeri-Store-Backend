const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },
    lastname: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 40,
    },
    passwordhash: {
        type: String,
        required: true,
        minlength: 8
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isModerator: {
        type: Boolean,
        default: false
    },
  

    phonenumber: {
        type: String,
        
        minlength: 3,
        maxlength: 10,
    },
    wilaya: {
        type: String,
       
        minlength: 3,
        maxlength: 50,
    },
    commune: {
        type: String,
        
        minlength: 3,
        maxlength: 50,
    },
    code_postal: {
        type: String, 
        
        minlength: 3,
        maxlength: 10,
    },
    adresse: {
        type: String,
        
        minlength: 3,
        maxlength: 200,
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;
