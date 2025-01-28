const { buildSchema } = require("graphql");

const GETschemma = buildSchema(`
    enum Typestore {
        accessoire
        vetement
    }

    type Category {
        _id: String
        name: String
        icon: String
        description: String
        typestore: Typestore
    }

    input InputCategory {
        name: String!
        icon: String
        description: String!
        typestore: Typestore!
    }

    input DeleteInput {
        categoryId: String!
        token: String!
        password: String!
    }

    type Response {
        category: Category
        message: String
    }

    type Query {
        CategoryGETById(_id: String!): Category
        CategoryGET: [Category]
    }

    type Mutation {
        categoryCreate(input: InputCategory!): Response
        categoryDelete(input: DeleteInput!): Response
    }
`);
const POSTschemma = buildSchema(`
        
  
    enum Typestore {
        accessoire
        vetement
    }

    type Category {
        _id: String
        name: String
        icon: String
        description: String
        typestore: Typestore
    }

    input InputCategory {
        name: String!
        icon: String
        description: String!
        typestore: Typestore!
    }

    input DeleteInput {
        categoryId: String!
        token: String!
        password: String!
    }

    type Response {
        category: Category
        message: String
    }

    type Query {
    _empty: String

    }

    type Mutation {
        categoryCreate(input: InputCategory!): Response
        categoryDelete(input: DeleteInput!): Response
    }
        `)

module.exports = { GETschemma ,POSTschemma};
