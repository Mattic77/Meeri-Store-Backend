const express = require('express');
const router = express.Router();
const cors = require('cors'); 
const asyncHandler = require('express-async-handler');
const User = require('../models/User')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 
const { createHandler } = require("graphql-http/lib/use/express");
const {schema,Authschema} = require('../schemas/userschema');
const resolvers = require('../resolvers/usersresolver');
const {verifyTokenModerator,GetidfromToken,verifyTokenAdmin} = require('../helpers/verify')




/**
 * @desc get  all users 
 * @method get
 * @route /
 * @access public
 */

router.use(
    '/userGET',
    (req, res) => {
    createHandler({
      schema,
      rootValue: resolvers,
      context: { req,res }, 

    })(req, res);
}
  );
/**
 * @desc  crud data 
 * @method post
 * @route /
 * @access public
 */

router.use(
    '/userauth',
    (req, res) => {
    createHandler({
      schema:Authschema,
      rootValue: resolvers,
      context: { req,res }, 

    })(req, res); 
}
  );

   










router.get('/countusers', async (req, res) => {
    try {
        const user = await  verifyTokenModerator(req)
        const userstcount = await User.countDocuments();
        res.status(200).send({ success: true, count: userstcount });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('Moderator/:id',async(req,res)=>{
    

})
router.put('/Update/:id', async (req, res) => {
        const user = await  verifyTokenAdmin(req)
    
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Invalid user ID' });
    }
    const updateduser = await User.findByIdAndUpdate(
        req.params.id,
        {
            email: req.body.email,
            username: req.body.username,
            
            isModerator: req.body.isModerator,
        },
        { new: true }
    ).select('username email isModerator updatedAt'); 

    if (!updateduser) {
        return res.status(404).send('The user cannot be updated');
    }
    res.send({updateduser});
});

/**
 * @desc delete user
 * @method delete
 * @route /api/users/:id
 * @access public
 */

  module.exports = router;