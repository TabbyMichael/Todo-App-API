// __tests__/resolvers.test.js
const resolvers = require('../resolvers');
const data = require('../data');
const bcrypt = require('bcryptjs');

// Capture the initial state of the data for resetting between tests
const originalData = {
  users: JSON.parse(JSON.stringify(data.users)),
  todos: JSON.parse(JSON.stringify(data.todos)),
};

describe('Resolvers', () => {
  // Mock context for an authenticated user (John Doe)
  const mockContext = { user: originalData.users[0] };

  beforeEach(() => {
    // Reset data before each test
    data.users.length = 0;
    data.todos.length = 0;
    data.users.push(...JSON.parse(JSON.stringify(originalData.users)));
    data.todos.push(...JSON.parse(JSON.stringify(originalData.todos)));
  });

  describe('Query', () => {
    it('should get all todos', () => {
      const allTodos = resolvers.Query.getAllTodos();
      expect(allTodos).toHaveLength(3);
    });

    it('should get todos for a specific user', () => {
      const userTodos = resolvers.Query.getTodosByUser(null, { userId: '1' });
      expect(userTodos).toHaveLength(2);
    });

    it('should get all users', () => {
      const allUsers = resolvers.Query.getAllUsers();
      expect(allUsers).toHaveLength(2);
    });

    it('should fetch the current authenticated user with "me" query', () => {
      const me = resolvers.Query.me(null, {}, mockContext);
      expect(me).toEqual(mockContext.user);
    });

    it('should throw an error for "me" query if not authenticated', () => {
      expect(() => resolvers.Query.me(null, {}, {})).toThrow('You are not authenticated!');
    });
  });

  describe('Mutation', () => {
    describe('signUp', () => {
      it('should sign up a new user and return a token', () => {
        const result = resolvers.Mutation.signUp(null, {
          username: 'New User',
          email: 'new@example.com',
          password: 'newpassword',
        });
        expect(result.user.username).toBe('New User');
        expect(result.token).toEqual(expect.any(String));
        expect(data.users).toHaveLength(3);
        const newUser = data.users.find(u => u.email === 'new@example.com');
        expect(bcrypt.compareSync('newpassword', newUser.password)).toBe(true);
      });
    });

    describe('login', () => {
      it('should log in an existing user and return a token', () => {
        const result = resolvers.Mutation.login(null, { email: 'john@example.com', password: 'password' });
        expect(result.user.email).toBe('john@example.com');
        expect(result.token).toEqual(expect.any(String));
      });

      it('should throw an error for invalid email', () => {
        expect(() => resolvers.Mutation.login(null, { email: 'wrong@example.com', password: 'password' })).toThrow('Invalid credentials.');
      });

      it('should throw an error for invalid password', () => {
        expect(() => resolvers.Mutation.login(null, { email: 'john@example.com', password: 'wrongpassword' })).toThrow('Invalid credentials.');
      });
    });

    describe('addTodo', () => {
      it('should add a new todo for the authenticated user', () => {
        const newTodo = resolvers.Mutation.addTodo(null, { text: 'Test Todo' }, mockContext);
        expect(newTodo.text).toBe('Test Todo');
        expect(newTodo.userId).toBe(mockContext.user.id);
        expect(data.todos).toHaveLength(4);
      });

      it('should throw an error if not authenticated', () => {
        expect(() => resolvers.Mutation.addTodo(null, { text: 'Test Todo' }, {})).toThrow('You are not authenticated!');
      });
    });

    describe('updateTodo', () => {
      it('should update a todo for the authenticated user', () => {
        const updatedTodo = resolvers.Mutation.updateTodo(null, { id: '1' }, mockContext);
        expect(updatedTodo.completed).toBe(true);
      });

      it('should throw an error if trying to update another user\'s todo', () => {
        expect(() => resolvers.Mutation.updateTodo(null, { id: '3' }, mockContext)).toThrow('You are not authorized to perform this action.');
      });

      it('should throw an error if not authenticated', () => {
        expect(() => resolvers.Mutation.updateTodo(null, { id: '1' }, {})).toThrow('You are not authenticated!');
      });

      it('should throw an error if todo not found', () => {
        expect(() => resolvers.Mutation.updateTodo(null, { id: '999' }, mockContext)).toThrow('Todo not found.');
      });
    });

    describe('deleteTodo', () => {
      it('should delete a todo for the authenticated user', () => {
        const deletedTodo = resolvers.Mutation.deleteTodo(null, { id: '1' }, mockContext);
        expect(deletedTodo.id).toBe('1');
        expect(data.todos).toHaveLength(2);
      });

      it('should throw an error if trying to delete another user\'s todo', () => {
        expect(() => resolvers.Mutation.deleteTodo(null, { id: '3' }, mockContext)).toThrow('You are not authorized to perform this action.');
      });

      it('should throw an error if not authenticated', () => {
        expect(() => resolvers.Mutation.deleteTodo(null, { id: '1' }, {})).toThrow('You are not authenticated!');
      });

      it('should throw an error if todo not found', () => {
        expect(() => resolvers.Mutation.deleteTodo(null, { id: '999' }, mockContext)).toThrow('Todo not found.');
      });
    });
  });

  describe('Nested Resolvers', () => {
    it("should get a user's todos", () => {
      const user = { id: '1' };
      const result = resolvers.User.todos(user);
      expect(result).toHaveLength(2);
    });

    it("should get a todo's user", () => {
      const todo = { userId: '1' };
      const result = resolvers.Todo.user(todo);
      expect(result.id).toBe('1');
    });
  });
});