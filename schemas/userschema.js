const { buildSchema } = require("graphql");
const { GraphQLScalarType, Kind } = require('graphql');
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Custom scalar type for Date',
  parseValue(value) {
    return new Date(value);
  },
  serialize(value) {
    return value.getTime(); 
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  },
});

const schema = buildSchema(`
  scalar Date
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
    createdAt :Date

  }
       type UserAdmin {
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
    createdAt :Date
    isModerator :Boolean

  }
  
    type Query {
      usersGET: [UserAdmin] 
      userGETById :User
      userDELETE(_id:String) : User

    }
  `);
  const Authschema = buildSchema(`
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
        password: String
        new_password : String

    }



  type Query {
    _empty: String
  }
    type responseedituser{
    user : User
    message: String
    }
    type response {
    username : String
    token: String
    message: String
    success : Boolean
    }
    type Mutation {
      userRegister(input :registerinput) : response
      userLogin(input: logininput) : response
      userLoginAdmin(input: logininput) : response
      userDELETE(input: deleteinput) : response
      userEdit(input:edituserinput) : responseedituser
      userChangePassword(input: passwordchancheinput): response
      userChangeEmail(input: emailchancheinput): response
      userForgotPassword(input: forgotpasswordinput): response
      userLogout : response

    }
    
    `)
  module.exports = {schema,Authschema};