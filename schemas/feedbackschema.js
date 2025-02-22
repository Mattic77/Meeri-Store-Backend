
const { buildSchema } = require("graphql");

const GETschemma = buildSchema(`

    type Productsize{
    size : String
    stock : Int
    }
    

    type Productdetail{
    color : String
    sizes: [Productsize]

    }
    type Product{
        _id :String
        name: String
        description: String
        richDescription: String
        images: [String]
        brand: String
        Price: Int
        category:String
        CountINStock:Int
        rating: Int
        IsFeatured: Boolean
        productdetail: [Productdetail]
    }

    type User {
        username : String
        email: String

    }
        type Userfeedback{
            user : User
            comment: String
            rating: Int
        }

    type feedback {
        product: Product
        userfeedback: [Userfeedback] 
    }

    type Query {
            feedbackGET:[feedback]
            feedbackproductGET(_id : String ): feedback
    }
`);

const POSTschemma = buildSchema(`

    type User{
        username : String
        }


    input  Userfeedback{
        comment : String
    rating : Int
    }
    input inputfeedback {
    product: ID
    userfeedback : Userfeedback
    }
    input deletefeedback{
        product: ID!
    }
        input deleteUserfeedbackInput {
    product: ID! # ID of the product associated with the feedback
    userId: ID!  # ID of the user whose feedback is to be deleted
}
    

    type Query {
            _empty : String
        }
    type Response{
    message: String
    }
    type Mutation {
        ADDfeedback(input: inputfeedback): Response
        DELETEfeedback(input: deletefeedback): Response
        DELETEfeedbackAdmin(input: deleteUserfeedbackInput) : Response
    }
`);

module.exports = { GETschemma, POSTschemma };