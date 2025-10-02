// schema.js
const gql = require('graphql-tag');

const typeDefs = gql`
  # AuthPayload Type
  type AuthPayload {
    token: String!
    user: User!
  }

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
    me: User
  }

  # Mutations
  type Mutation {
    signUp(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    addTodo(text: String!): Todo!
    updateTodo(id: ID!): Todo!
    deleteTodo(id: ID!): Todo
  }
`;

module.exports = typeDefs;