const { buildSchema } = require("graphql");


const schema = buildSchema(`
   type User {
    _id :String
    firstname : String
    lastname : String
    username: String
    email: String
    phonenumber : String
    wilaya : String
    commune : String
    code_postal : String
    adresse : String

  }
  
    type Query {
      usersGET: [User] 
      userGETById(_id :String) :User
      userDELETE(_id:String) : User

    }
  `);
  const Authschema = buildSchema(`
    input logininput{
    email: String
    password : String}

    input registerinput{
     
        email: String
        firstname: String
        lastname: String
        passwordhash: String

    }
    input passwordchancheinput{
        oldpassword: String
         password: String
    }
    input emailchancheinput{
    newemail: String
    password : String
    }
    input forgotpasswordinput{
    email: String
    }
    input edituserinput{
     
      firstname : String
      lastname : String
      username: String
      phonenumber : String
      wilaya : String
      commune : String
      code_postal : String
      adresse : String

    }
        input deleteinput{
        token :String 
        password: String

    }
  type Query {
    _empty: String
  }
    type response {
    username : String
    token: String
    message: String
    path :String
    }
    type Mutation {
      userRegister(input :registerinput) : response
      userLogin(input: logininput) : response
      userDELETE(input: deleteinput) : response
      userEdit(input:edituserinput) : response
      userChangePassword(input: passwordchancheinput): response
      userChangeEmail(input: emailchancheinput): response
      userForgotPassword(input: forgotpasswordinput): response
    }
    
    `)
  module.exports = {schema,Authschema};