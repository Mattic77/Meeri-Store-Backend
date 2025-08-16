
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const sendemailauth = require('../Email/User/Auth');
const sendemailrestpass = require('../Email/User/Forgetpass');
const crypto = require('crypto');
const {GetidfromToken,verifyTokenAdmin} = require('../helpers/verify')

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const resolvers = {
    usersGET: async (args,context) => {
        try {
          const user =await verifyTokenAdmin(context.req)
          const Userlist = await User.find().select('-passwordhash'); 
          return Userlist;
        } catch (error) {
          throw new Error('Error fetching users: ' + error.message);
        }
      },
  
    userGETById: async (args,context) => {
      try {

        const Userid = await GetidfromToken(context.req)
        const user = await User.findById(Userid._id).select('-passwordhash');
        return user;  
      } catch (err) {
        console.error(err);
        throw new Error('User not found');
      }
    },
    userDELETE : async (args,context) =>{
        const userF = await GetidfromToken(context.req)
        const user = await User.findById(userF._id);
        if (user) {
            const ismatch = await bcrypt.compare(args.input.password,user.passwordhash)
            if(!ismatch){
                return {
                    message: 'password mismatch',
                };        
            }else{
                await User.findByIdAndDelete(user._id);
            return {
                username: user.username,
                message: 'User deleted successfully',
            };        
                 } }
         else {
            return {
                message: 'User not found',
            }
        }
    },
    userRegister: async (args) => {
        try {
            const { firstname, lastname, email, passwordhash } = args.input;
    
            // Check if the user already exists
            let newUser = await User.findOne({ email });
            if (newUser) {
                return { message: "This user already exists" };
            }
    
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passwordhash, salt);
    
            // Generate a username
            const username = `${firstname} ${lastname}`.replace(/\s+/g, '').toLowerCase(); // Remove spaces and lowercase
    
            // Create the user
            newUser = new User({
                firstname,
                lastname,
                email,
                username,
                passwordhash: hashedPassword,
            });
    
            const result = await newUser.save();
    
            // Send welcome email
            const message = `Welcome to Meeristore, ${username}! We're thrilled to have you with us. Visit https://meeristore.com to start shopping.`;
            await sendemailauth({ recipients: email, message });
    
            // Return success response
            return {
                username: newUser.username,
                message: "User registered successfully",
                token: jwt.sign(
                    { id: result._id, email: result.email },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                ),
            };
        } catch (error) {
            console.error("Error creating account:", error);
            return { message: "An error occurred while processing your request" };
        }
    },
    userLogin :async (args,context)=>{
        const {email , password} = args.input;
        const user = await User.findOne({ email });
        if (!user) {
            return { message: 'User not found' }
        }
        
        const validPassword = await bcrypt.compare(password, user.passwordhash);
        if (!validPassword) {
            return { message: 'Invalid password' };
        }
    
        const token = jwt.sign(
            {
                user_id: user._id,
                isAdmin: user.isAdmin,
                isModerator : user.isModerator
            },
            process.env.JWT_SECRET,
            {expiresIn : "1w"}
        );
        
        return { username: user.username, token: token, message:" User logged in  successfully "};
    },
    userLoginAdmin :async (args,context)=>{
        const {email , password} = args.input;
        const user = await User.findOne({ email });
        if (!user) {
            return { message: 'User not found' }
        }
        // Check if the user has admin or moderator privileges
        if (!user.isAdmin && !user.isModerator) { // Adjust logic for "and"
            return { message: 'You are not allowed to log in' };
        }
        const validPassword = await bcrypt.compare(password, user.passwordhash);
        if (!validPassword) {
            return { message: 'Invalid password' };
        }
    
        const token = jwt.sign(
            {
                user_id: user._id,
                isAdmin: user.isAdmin,
                isModerator : user.isModerator
            },
            process.env.JWT_SECRET,
            {expiresIn : "1w"}
        );
        
        return { username: user.username, token: token, message:" User logged in  successfully "};
    },
    userChangePassword :async (args,context)=>{
        try {
        const { oldpassword, password } = args.input;
        const userF = await verifyTokenAdmin(context.req)
        const user = await User.findById(userF._id);
        if (user) {
            const isMatch = await bcrypt.compare(oldpassword, user.passwordhash);
            if(!isMatch){
                return {
                    message: 'password mismatch',
                };        
            }else{
                const salt = await bcrypt.genSalt(10)
                const hashedPassword= await bcrypt.hash(password,salt)
                await User.findByIdAndUpdate(user._id, { passwordhash: hashedPassword });
                return {
                    username: user.username,
                    message: 'Password changed successfully',
                };        
                 } }
         else {
            return {
                message: 'User not found',
            }
        }}catch (error) {
            console.error('Error changing Password:', error);
            return { message: 'An error occurred while processing your request' };
        }
    },
    userEdit: async (args, context) => {
  try {
    const userID = await GetidfromToken(context.req);

    const user = await User.findByIdAndUpdate(
      userID._id, 
      {
        firstname: args.input.firstname,
        lastname: args.input.lastname,
        username: args.input.username,
        phonenumber: args.input.phonenumber,
        wilaya: args.input.wilaya,
        commune: args.input.commune,
        code_postal: args.input.code_postal,
        adresse: args.input.adresse,
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return {
        message: 'User not found',
      };
    }

    return {
      user: user, // Return the updated user's username
      message: 'User updated successfully',
    };
  } catch (error) {
    console.error('Error on updating data:', error);
    return { message: 'An error occurred while processing your request' };
  }
},
     userChangeEmail : async (args, context) => {
        const { newemail, password } = args.input;
        const req = context.req;
    
        try {
            const authHeader = req.headers['authorization'];
            if (!authHeader) {
                return { message: 'Authorization header missing' };
            }
    
            const token = authHeader.split(' ')[1];
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                return { message: 'Invalid or expired token' };
            }
    
            // Find user by decoded user ID
            const user = await User.findById(decoded.user_id);
            if (!user) {
                return { message: 'User not found' };
            }
    
            // Validate password
            const isMatch = await bcrypt.compare(password, user.passwordhash);
            if (!isMatch) {
                return { message: 'Password mismatch' };
            }
    
            // Validate new email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newemail)) {
                return { message: 'Invalid email format' };
            }
    
            // Check if the email is already in use
            const emailExists = await User.findOne({ email: newemail });
            if (emailExists) {
                return { message: 'Email already in use' };
            }
    
            // Update user's email
            await User.findByIdAndUpdate(user._id, { email: newemail });
    
            return {
                username: user.username,
                message: 'Email changed successfully',
            };
        } catch (error) {
            console.error('Error changing email:', error);
            return { message: 'An error occurred while processing your request' };
        }
    },
    userForgotPassword : async (args) => {
        const { email } = args.input;
    
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return { message: "User not found" };
        }
    
        // Generate reset token and expiration
        const resetToken = generateResetToken();
        const expirationTime = Date.now() + 3600000; // Token valid for 1 hour
    
        user.resetToken = resetToken;
        user.resetTokenExpiration = expirationTime;
        await user.save();
    
        // Send the reset email
        const resetLink = `https://meeristore.store/resetPassword?token=${resetToken}`;
        const message = `Hi ${user.firstname},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.`;
        await sendemailrestpass({ recipients: user.email, message ,name :user.username,resetLink});
    
        return { message: "Password reset link sent to your email." ,
            success : true
        };
    },


    };

  
  module.exports= resolvers