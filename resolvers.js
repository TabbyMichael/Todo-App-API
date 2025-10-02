// resolvers.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');
const { users, todos } = require('./data');

const JWT_SECRET = 'my-super-secret-key'; // In a real app, this should be an environment variable

const resolvers = {
  Query: {
    getAllTodos: () => todos,
    getTodosByUser: (parent, { userId }) => {
      return todos.filter(todo => todo.userId === userId);
    },
    getAllUsers: () => users,
    me: (parent, args, context) => {
      if (!context.user) {
        throw new GraphQLError('You are not authenticated!', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return context.user;
    },
  },
  Mutation: {
    signUp: (parent, { username, email, password }) => {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = {
        id: String(users.length + 1),
        username,
        email,
        password: hashedPassword,
      };
      users.push(newUser);

      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '1h' });

      return {
        token,
        user: newUser,
      };
    },
    login: (parent, { email, password }) => {
      const user = users.find(user => user.email === email);
      if (!user) {
        throw new GraphQLError('Invalid credentials.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
        throw new GraphQLError('Invalid credentials.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

      return {
        token,
        user,
      };
    },
    addTodo: (parent, { text }, context) => {
      if (!context.user) {
        throw new GraphQLError('You are not authenticated!', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const newTodo = {
        id: String(todos.length + 1),
        text,
        completed: false,
        userId: context.user.id,
      };
      todos.push(newTodo);
      return newTodo;
    },
    updateTodo: (parent, { id }, context) => {
      if (!context.user) {
        throw new GraphQLError('You are not authenticated!', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const todo = todos.find(todo => todo.id === id);
      if (!todo) {
        throw new GraphQLError('Todo not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      if (todo.userId !== context.user.id) {
        throw new GraphQLError('You are not authorized to perform this action.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      todo.completed = !todo.completed;
      return todo;
    },
    deleteTodo: (parent, { id }, context) => {
      if (!context.user) {
        throw new GraphQLError('You are not authenticated!', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const todoIndex = todos.findIndex(todo => todo.id === id);
      if (todoIndex === -1) {
        throw new GraphQLError('Todo not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      const todo = todos[todoIndex];
      if (todo.userId !== context.user.id) {
        throw new GraphQLError('You are not authorized to perform this action.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      const [deletedTodo] = todos.splice(todoIndex, 1);
      return deletedTodo;
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