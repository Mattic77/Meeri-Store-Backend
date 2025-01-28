const { buildSchema } = require("graphql");

const GETschemma = buildSchema(`
type OrderItem {
    _id: ID
    quantity: Int
    product: ID
    createdAt: Date
    updatedAt: Date
}
type User{
    _id: ID
    username: String
}
scalar Date
type Order {
  _id: ID
  idorder: Int 
  orderitems: [OrderItem]
  adress: String
  city: String
  postalcode: String
  phonenumber: String
  status: String
  totalprice: Float
  quantityOrder: Int
  user: User
  dateordered: Date
  createdAt: Date
  updatedAt: Date
}



    type Query {
        orderGETById(_id: ID!): Order
        orderGET: [Order]
        userorderGET(_id: ID): Order
    }


    
    `)

    const POSTschemma = buildSchema(`
        type OrderItem {
            _id: ID
            quantity: Int
            product: ID
            createdAt: String
            updatedAt: String
        }
        
        type User {
            _id: ID
            username: String
        }
        scalar Date

        type Order {
        _id: ID
        idorder: Int 
        orderitems: [OrderItem]
        adress: String
        city: String
        postalcode: String
        phonenumber: String
        status: String
        totalprice: Float
        quantityOrder: Int
        user: User
        dateordered: Date
        createdAt: Date
        updatedAt: Date
        }

        
        input OrderItemInput {
            quantity: Int
            product: ID
        }
        
        input OrderInput {
            orderitems: [OrderItemInput]
            adress: String
            city: String
            postalcode: String
            phonenumber: String
            totalprice: Float
            quantityOrder: Int
        }
        
        input DeleteInput {
            _id: String
        }
        input statusINPUT{
        _id: String
        status: String
        }
        
        type Response {
            order: Order
            message: String
        }
                    type Query {
            _empty: String
        }
        
        type Mutation {
            createOrder(input: OrderInput): Response
            updateOrderStatus(input :statusINPUT): Response
            orderDELETE(input: DeleteInput): Response
        }
        `);
    module.exports = { GETschemma, POSTschemma };