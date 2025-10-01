// resolvers.js
const { users, todos } = require('./data');

const resolvers = {
  Query: {
    getAllTodos: () => todos,
    getTodosByUser: (parent, { userId }) => {
      return todos.filter(todo => todo.userId === userId);
    },
    getAllUsers: () => users,
  },
  Mutation: {
    addTodo: (parent, { userId, text }) => {
      const newTodo = {
        id: String(todos.length + 1),
        text,
        completed: false,
        userId,
      };
      todos.push(newTodo);
      return newTodo;
    },
    updateTodo: (parent, { id }) => {
      const todo = todos.find(todo => todo.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        return todo;
      }
      return null;
    },
    deleteTodo: (parent, { id }) => {
        const todoIndex = todos.findIndex(todo => todo.id === id);
        if (todoIndex > -1) {
            const [deletedTodo] = todos.splice(todoIndex, 1);
            return deletedTodo;
        }
        return null;
    },
    addUser: (parent, { username, email }) => {
        const newUser = {
            id: String(users.length + 1),
            username,
            email,
        };
        users.push(newUser);
        return newUser;
    },
  },
  User: {
    todos: (parent) => {
      return todos.filter(todo => todo.userId === parent.id);
    },
  },
  Todo: {
    user: (parent) => {
      return users.find(user => user.id === parent.userId);
    },
  },
};

module.exports = resolvers;