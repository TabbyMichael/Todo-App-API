// index.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const jwt = require('jsonwebtoken');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { users } = require('./data');

const JWT_SECRET = 'my-super-secret-key';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  const { url } = await startStandaloneServer(server, {
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