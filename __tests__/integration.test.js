// __tests__/integration.test.js
const { ApolloServer } = require('@apollo/server');
const typeDefs = require('../schema');
const resolvers = require('../resolvers');
const { users, todos } = require('../data');

// A simple deep copy to reset data between tests
const originalData = JSON.parse(JSON.stringify({ users, todos }));

describe('Integration Tests', () => {
  let testServer;

  beforeAll(() => {
    testServer = new ApolloServer({
      typeDefs,
      resolvers,
    });
  });

  beforeEach(() => {
    // Reset data before each test
    const { users: newUsers, todos: newTodos } = JSON.parse(JSON.stringify(originalData));

    // Clear the arrays and push the original data back in
    require('../data').users.length = 0;
    require('../data').todos.length = 0;
    require('../data').users.push(...newUsers);
    require('../data').todos.push(...newTodos);
  });

  describe('Queries', () => {
    it('should fetch all todos', async () => {
      const response = await testServer.executeOperation({
        query: 'query GetAllTodos { getAllTodos { id text } }',
      });
      expect(response.body.singleResult.data.getAllTodos.length).toBe(3);
    });

    it('should fetch todos for a specific user', async () => {
      const response = await testServer.executeOperation({
        query: 'query GetTodosByUser($userId: ID!) { getTodosByUser(userId: $userId) { id text } }',
        variables: { userId: '1' },
      });
      expect(response.body.singleResult.data.getTodosByUser.length).toBe(2);
    });

    it('should fetch all users', async () => {
      const response = await testServer.executeOperation({
        query: 'query GetAllUsers { getAllUsers { id username } }',
      });
      expect(response.body.singleResult.data.getAllUsers.length).toBe(2);
    });
  });

  describe('Mutations', () => {
    it('should add a new todo and verify it exists', async () => {
      const addResponse = await testServer.executeOperation({
        query: `
          mutation AddTodo($userId: ID!, $text: String!) {
            addTodo(userId: $userId, text: $text) {
              id
              text
              completed
            }
          }
        `,
        variables: { userId: '1', text: 'New Integration Todo' },
      });

      expect(addResponse.body.singleResult.data.addTodo.text).toBe('New Integration Todo');

      const verifyResponse = await testServer.executeOperation({
        query: '{ getAllTodos { text } }',
      });
      const allTodos = verifyResponse.body.singleResult.data.getAllTodos;
      expect(allTodos.length).toBe(4);
      expect(allTodos.some(todo => todo.text === 'New Integration Todo')).toBe(true);
    });

    it('should update a todo and verify the change', async () => {
      await testServer.executeOperation({
        query: 'mutation UpdateTodo($id: ID!) { updateTodo(id: $id) { completed } }',
        variables: { id: '1' },
      });

      const verifyResponse = await testServer.executeOperation({
        query: 'query GetTodosByUser($userId: ID!) { getTodosByUser(userId: $userId) { id completed } }',
        variables: { userId: '1' },
      });
      const userTodos = verifyResponse.body.singleResult.data.getTodosByUser;
      const updatedTodo = userTodos.find(todo => todo.id === '1');
      expect(updatedTodo.completed).toBe(true);
    });

    it('should delete a todo and verify it is gone', async () => {
      await testServer.executeOperation({
        query: 'mutation DeleteTodo($id: ID!) { deleteTodo(id: $id) { id } }',
        variables: { id: '1' },
      });

      const verifyResponse = await testServer.executeOperation({
        query: '{ getAllTodos { id } }',
      });
      const allTodos = verifyResponse.body.singleResult.data.getAllTodos;
      expect(allTodos.length).toBe(2);
      expect(allTodos.some(todo => todo.id === '1')).toBe(false);
    });

    it('should add a user and verify they exist', async () => {
      await testServer.executeOperation({
        query: 'mutation AddUser($username: String!, $email: String!) { addUser(username: $username, email: $email) { username } }',
        variables: { username: 'New User', email: 'new@example.com' },
      });

      const verifyResponse = await testServer.executeOperation({
        query: '{ getAllUsers { username } }',
      });
      const allUsers = verifyResponse.body.singleResult.data.getAllUsers;
      expect(allUsers.length).toBe(3);
      expect(allUsers.some(user => user.username === 'New User')).toBe(true);
    });
  });
});