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
const resolvers = require('../resolvers/usersresolver')



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
 * @desc get  all users 
 * @method get
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
        const userstcount = await User.countDocuments();
        res.status(200).send({ success: true, count: userstcount });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


router.put('/Update/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Invalid user ID' });
    }
    const updateduser = await User.findByIdAndUpdate(
        req.params.id,
        {
            email: req.body.email,
            username: req.body.username,
            passwordhash: req.body.passwordhash,
            isAdmin: req.body.isAdmin,
            phonenumber : req.body.phonenumber,
            wilaya : req.body.wilaya,
            commune : req.body.commune,
            code_postal : req.body.code_postal,
            adresse : req.body.adresse,
        },
        { new: true }
    );

    if (!updateduser) {
        return res.status(404).send('The user cannot be updated');
    }
    res.send(updateduser);
});

/**
 * @desc delete user
 * @method delete
 * @route /api/users/:id
 * @access public
 */

  module.exports = router;