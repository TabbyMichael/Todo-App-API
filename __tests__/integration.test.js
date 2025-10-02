/**
 * @file Integration tests for the Apollo Server application, focusing on authentication and authorization.
 */

const { ApolloServer } = require('@apollo/server');
const typeDefs = require('../schema');
const resolvers = require('../resolvers');
const data = require('../data');

// A simple deep copy to reset data between tests
const originalData = {
  users: JSON.parse(JSON.stringify(data.users)),
  todos: JSON.parse(JSON.stringify(data.todos)),
};

describe('Integration Tests with Auth', () => {
  let testServer;
  let authenticatedContext;

  beforeAll(() => {
    testServer = new ApolloServer({
      typeDefs,
      resolvers,
    });
    // Create a context that simulates an authenticated user (John Doe)
    authenticatedContext = { user: originalData.users.find(u => u.id === '1') };
  });

  beforeEach(() => {
    // Reset data before each test to ensure test isolation
    data.users.length = 0;
    data.todos.length = 0;
    data.users.push(...JSON.parse(JSON.stringify(originalData.users)));
    data.todos.push(...JSON.parse(JSON.stringify(originalData.todos)));
  });

  /**
   * Test suite for authentication-related operations like sign-up and login.
   */
  describe('Authentication', () => {
    /**
     * Tests the signUp mutation to ensure a new user can be created successfully.
     */
    it('should sign up a new user and return a token and user', async () => {
      const response = await testServer.executeOperation({
        query: `
          mutation SignUp($username: String!, $email: String!, $password: String!) {
            signUp(username: $username, email: $email, password: $password) {
              token
              user { id username email }
            }
          }
        `,
        variables: { username: 'New User', email: 'new@example.com', password: 'password123' },
      });

      const { token, user } = response.body.singleResult.data.signUp;
      expect(token).toEqual(expect.any(String));
      expect(user.username).toBe('New User');
      expect(data.users.length).toBe(3);
    });

    /**
     * Tests the login mutation to ensure an existing user can log in with correct credentials.
     */
    it('should log in an existing user and return a token', async () => {
      const response = await testServer.executeOperation({
        query: `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              token
              user { email }
            }
          }
        `,
        variables: { email: 'john@example.com', password: 'password' },
      });
      const { token, user } = response.body.singleResult.data.login;
      expect(token).toEqual(expect.any(String));
      expect(user.email).toBe('john@example.com');
    });

    /**
     * Tests that the login mutation fails when provided with an incorrect password.
     */
    it('should fail to log in with an incorrect password', async () => {
      const response = await testServer.executeOperation({
        query: `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              token
            }
          }
        `,
        variables: { email: 'john@example.com', password: 'wrongpassword' },
      });
      expect(response.body.singleResult.errors[0].message).toBe('Invalid credentials.');
    });
  });

  /**
   * Test suite for operations that require an authenticated user.
   */
  describe('Protected Operations', () => {
    /**
     * Tests the 'me' query to ensure it returns the currently authenticated user's data.
     */
    it('should fetch the authenticated user with the "me" query', async () => {
      const response = await testServer.executeOperation({
        query: 'query Me { me { id username } }',
      }, {
        contextValue: authenticatedContext,
      });
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data.me.id).toBe(authenticatedContext.user.id);
    });

    /**
     * Tests the addTodo mutation to ensure an authenticated user can add a new todo.
     */
    it('should add a todo for the authenticated user', async () => {
      const response = await testServer.executeOperation({
        query: 'mutation AddTodo($text: String!) { addTodo(text: $text) { text user { id } } }',
        variables: { text: 'Authenticated Todo' },
      }, {
        contextValue: authenticatedContext,
      });
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data.addTodo.user.id).toBe(authenticatedContext.user.id);
      expect(data.todos.length).toBe(4);
    });

    /**
     * Tests the updateTodo mutation to ensure an authenticated user can update their own todo.
     */
    it('should update a todo owned by the authenticated user', async () => {
      const response = await testServer.executeOperation({
        query: 'mutation UpdateTodo($id: ID!) { updateTodo(id: $id) { id completed } }',
        variables: { id: '1' },
      }, {
        contextValue: authenticatedContext,
      });
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data.updateTodo.completed).toBe(true);
    });

    /**
     * Tests the deleteTodo mutation to ensure an authenticated user can delete their own todo.
     */
    it('should delete a todo owned by the authenticated user', async () => {
      const response = await testServer.executeOperation({
        query: 'mutation DeleteTodo($id: ID!) { deleteTodo(id: $id) { id } }',
        variables: { id: '1' },
      }, {
        contextValue: authenticatedContext,
      });
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(data.todos.some(todo => todo.id === '1')).toBe(false);
    });
  });

  /**
   * Test suite for authorization and handling of unauthenticated access to protected operations.
   */
  describe('Authorization and Unauthenticated Access', () => {
    /**
     * Tests that the 'me' query fails when no user is authenticated.
     */
    it('should fail the "me" query if not authenticated', async () => {
      const response = await testServer.executeOperation({ query: 'query Me { me { id } }' });
      expect(response.body.singleResult.errors[0].message).toBe('You are not authenticated!');
    });

    /**
     * Tests that the addTodo mutation fails when no user is authenticated.
     */
    it('should fail to add a todo if not authenticated', async () => {
      const response = await testServer.executeOperation({
        query: 'mutation AddTodo($text: String!) { addTodo(text: $text) { id } }',
        variables: { text: 'Unauthenticated Todo' },
      });
      expect(response.body.singleResult.errors[0].message).toBe('You are not authenticated!');
    });

    /**
     * Tests that a user cannot update a todo owned by another user.
     */
    it('should fail to update a todo owned by another user', async () => {
      const response = await testServer.executeOperation({
        query: 'mutation UpdateTodo($id: ID!) { updateTodo(id: $id) { id } }',
        variables: { id: '3' },
      }, {
        contextValue: authenticatedContext,
      });
      expect(response.body.singleResult.errors[0].message).toBe('You are not authorized to perform this action.');
    });

    /**
     * Tests that a user cannot delete a todo owned by another user.
     */
    it('should fail to delete a todo owned by another user', async () => {
      const response = await testServer.executeOperation({
        query: 'mutation DeleteTodo($id: ID!) { deleteTodo(id: $id) { id } }',
        variables: { id: '3' },
      }, {
        contextValue: authenticatedContext,
      });
      expect(response.body.singleResult.errors[0].message).toBe('You are not authorized to perform this action.');
    });
  });
});