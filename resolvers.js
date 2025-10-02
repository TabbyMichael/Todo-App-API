/**
 * @file This file contains the resolvers for the GraphQL schema.
 * @module resolvers
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');
const { users, todos } = require('./data');

const JWT_SECRET = 'my-super-secret-key'; // In a real app, this should be an environment variable

/**
 * @type {Object}
 * @property {Object} Query - Resolvers for GraphQL queries.
 * @property {Object} Mutation - Resolvers for GraphQL mutations.
 * @property {Object} User - Resolvers for the User type.
 * @property {Object} Todo - Resolvers for the Todo type.
 */
const resolvers = {
  Query: {
    /**
     * Retrieves all todos.
     * @returns {Array<Object>} A list of all todos.
     */
    getAllTodos: () => todos,
    /**
     * Retrieves all todos for a specific user.
     * @param {Object} parent - The parent resolver object.
     * @param {Object} args - The arguments for the resolver.
     * @param {string} args.userId - The ID of the user.
     * @returns {Array<Object>} A list of todos for the specified user.
     */
    getTodosByUser: (parent, { userId }) => {
      return todos.filter(todo => todo.userId === userId);
    },
    /**
     * Retrieves all users.
     * @returns {Array<Object>} A list of all users.
     */
    getAllUsers: () => users,
    /**
     * Retrieves the currently authenticated user.
     * @param {Object} parent - The parent resolver object.
     * @param {Object} args - The arguments for the resolver.
     * @param {Object} context - The context object, containing the authenticated user.
     * @returns {Object} The authenticated user's data.
     * @throws {GraphQLError} If the user is not authenticated.
     */
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
    /**
     * Signs up a new user.
     * @param {Object} parent - The parent resolver object.
     * @param {Object} args - The arguments for the resolver.
     * @param {string} args.username - The username for the new user.
     * @param {string} args.email - The email for the new user.
     * @param {string} args.password - The password for the new user.
     * @returns {Object} An authentication payload containing a token and the new user's data.
     */
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
    /**
     * Logs in an existing user.
     * @param {Object} parent - The parent resolver object.
     * @param {Object} args - The arguments for the resolver.
     * @param {string} args.email - The user's email.
     * @param {string} args.password - The user's password.
     * @returns {Object} An authentication payload containing a token and the user's data.
     * @throws {GraphQLError} If the credentials are invalid.
     */
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
    /**
     * Adds a new todo for the authenticated user.
     * @param {Object} parent - The parent resolver object.
     * @param {Object} args - The arguments for the resolver.
     * @param {string} args.text - The text of the new todo.
     * @param {Object} context - The context object, containing the authenticated user.
     * @returns {Object} The newly created todo.
     * @throws {GraphQLError} If the user is not authenticated.
     */
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
    /**
     * Toggles the completed status of a todo.
     * @param {Object} parent - The parent resolver object.
     * @param {Object} args - The arguments for the resolver.
     * @param {string} args.id - The ID of the todo to update.
     * @param {Object} context - The context object, containing the authenticated user.
     * @returns {Object} The updated todo.
     * @throws {GraphQLError} If the user is not authenticated, the todo is not found, or the user is not authorized.
     */
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
    /**
     * Deletes a todo.
     * @param {Object} parent - The parent resolver object.
     * @param {Object} args - The arguments for the resolver.
     * @param {string} args.id - The ID of the todo to delete.
     * @param {Object} context - The context object, containing the authenticated user.
     * @returns {Object|null} The deleted todo, or null if not found.
     * @throws {GraphQLError} If the user is not authenticated, the todo is not found, or the user is not authorized.
     */
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
    /**
     * Fetches the todos for a specific user.
     * @param {Object} parent - The parent user object.
     * @returns {Array<Object>} A list of todos for the user.
     */
    todos: (parent) => {
      return todos.filter(todo => todo.userId === parent.id);
    },
  },
  Todo: {
    /**
     * Fetches the user who owns a specific todo.
     * @param {Object} parent - The parent todo object.
     * @returns {Object} The user who owns the todo.
     */
    user: (parent) => {
      return users.find(user => user.id === parent.userId);
    },
  },
};

module.exports = resolvers;