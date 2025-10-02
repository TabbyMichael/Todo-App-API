/**
 * @file This file defines the GraphQL schema for the application.
 * @module schema
 */

const gql = require('graphql-tag');

const typeDefs = gql`
  """
  Represents the authentication payload, containing a JWT token and user data.
  """
  type AuthPayload {
    "A JSON Web Token (JWT) for authenticating subsequent requests."
    token: String!
    "The user who has been authenticated."
    user: User!
  }

  """
  Represents a user of the application.
  """
  type User {
    "The unique identifier for the user."
    id: ID!
    "The username of the user."
    username: String!
    "The email address of the user."
    email: String!
    "A list of todos belonging to the user."
    todos: [Todo!]
  }

  """
  Represents a single todo item.
  """
  type Todo {
    "The unique identifier for the todo."
    id: ID!
    "The text content of the todo."
    text: String!
    "Indicates whether the todo has been completed."
    completed: Boolean!
    "The user who owns the todo."
    user: User!
  }

  """
  Defines the queries available in the GraphQL API.
  """
  type Query {
    "Retrieves all todo items."
    getAllTodos: [Todo!]
    "Retrieves all todo items for a specific user."
    getTodosByUser(userId: ID!): [Todo!]
    "Retrieves all users."
    getAllUsers: [User!]
    "Retrieves the currently authenticated user."
    me: User
  }

  """
  Defines the mutations available in the GraphQL API.
  """
  type Mutation {
    "Creates a new user account."
    signUp(username: String!, email: String!, password: String!): AuthPayload!
    "Logs in a user and returns an authentication payload."
    login(email: String!, password: String!): AuthPayload!
    "Adds a new todo item for the authenticated user."
    addTodo(text: String!): Todo!
    "Toggles the completion status of a todo item."
    updateTodo(id: ID!): Todo!
    "Deletes a todo item."
    deleteTodo(id: ID!): Todo
  }
`;

module.exports = typeDefs;