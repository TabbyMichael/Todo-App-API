// schema.js
const { gql } = require('@apollo/server');

const typeDefs = gql`
  # User Type
  type User {
    id: ID!
    username: String!
    email: String!
    todos: [Todo!]
  }

  # Todo Type
  type Todo {
    id: ID!
    text: String!
    completed: Boolean!
    user: User!
  }

  # Queries
  type Query {
    getAllTodos: [Todo!]
    getTodosByUser(userId: ID!): [Todo!]
    getAllUsers: [User!]
  }

  # Mutations
  type Mutation {
    addTodo(userId: ID!, text: String!): Todo!
    updateTodo(id: ID!): Todo!
    deleteTodo(id: ID!): Todo
    addUser(username: String!, email: String!): User!
  }
`;

module.exports = typeDefs;