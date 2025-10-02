/**
 * @file This file contains the in-memory data store for the application.
 * @module data
 */

const bcrypt = require('bcryptjs');

/**
 * An array of user objects.
 * @type {Array<Object>}
 * @property {string} id - The unique identifier for the user.
 * @property {string} username - The username of the user.
 * @property {string} email - The email of the user.
 * @property {string} password - The hashed password of the user.
 */
let users = [
  { id: '1', username: 'John Doe', email: 'john@example.com', password: bcrypt.hashSync('password', 10) },
  { id: '2', username: 'Jane Doe', email: 'jane@example.com', password: bcrypt.hashSync('password', 10) },
];

/**
 * An array of todo objects.
 * @type {Array<Object>}
 * @property {string} id - The unique identifier for the todo.
 * @property {string} text - The text content of the todo.
 * @property {boolean} completed - Whether the todo is completed or not.
 * @property {string} userId - The ID of the user who owns the todo.
 */
let todos = [
  { id: '1', text: 'Learn GraphQL', completed: false, userId: '1' },
  { id: '2', text: 'Build an Apollo Server', completed: true, userId: '1' },
  { id: '3', text: 'Deploy the app', completed: false, userId: '2' },
];

module.exports = { users, todos };