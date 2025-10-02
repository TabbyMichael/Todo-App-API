/**
 * @file This file is the main entry point for the Apollo Server application.
 * @module index
 */

const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const jwt = require('jsonwebtoken');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { users } = require('./data');

/**
 * The secret key for signing and verifying JSON Web Tokens (JWTs).
 * In a production application, this should be stored securely as an environment variable.
 * @type {string}
 */
const JWT_SECRET = 'my-super-secret-key';

/**
 * The Apollo Server instance.
 * @type {ApolloServer}
 */
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

/**
 * Starts the Apollo Server.
 * This function initializes the server and sets up the context for handling authentication.
 * @returns {Promise<void>}
 */
async function startServer() {
  const { url } = await startStandaloneServer(server, {
    /**
     * Creates the context for each GraphQL request.
     * This function extracts the JWT from the authorization header, verifies it,
     * and adds the authenticated user to the context.
     * @param {object} options - The options object.
     * @param {object} options.req - The incoming HTTP request object.
     * @returns {Promise<object>} The context object for the request.
     */
    context: async ({ req }) => {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const token = auth.substring(7, auth.length);
        try {
          const { userId } = jwt.verify(token, JWT_SECRET);
          const user = users.find(user => user.id === userId);
          return { user };
        } catch (error) {
          console.log('Invalid token');
        }
      }
      return {};
    },
    listen: { port: 4000 },
  });
  console.log(`🚀  Server ready at: ${url}`);
}

startServer();