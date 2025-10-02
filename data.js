// data.js
const bcrypt = require('bcryptjs');

// In-memory data store
let users = [
  { id: '1', username: 'John Doe', email: 'john@example.com', password: bcrypt.hashSync('password', 10) },
  { id: '2', username: 'Jane Doe', email: 'jane@example.com', password: bcrypt.hashSync('password', 10) },
];

let todos = [
  { id: '1', text: 'Learn GraphQL', completed: false, userId: '1' },
  { id: '2', text: 'Build an Apollo Server', completed: true, userId: '1' },
  { id: '3', text: 'Deploy the app', completed: false, userId: '2' },
];

module.exports = { users, todos };