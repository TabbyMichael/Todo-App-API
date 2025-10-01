// __tests__/resolvers.test.js
const resolvers = require('../resolvers');
const { users, todos } = require('../data');

// A simple deep copy to reset data between tests
const originalData = JSON.parse(JSON.stringify({ users, todos }));

describe('Resolvers', () => {
  beforeEach(() => {
    // Reset data before each test
    const { users: newUsers, todos: newTodos } = JSON.parse(JSON.stringify(originalData));

    // Clear the arrays and push the original data back in
    users.length = 0;
    todos.length = 0;
    users.push(...newUsers);
    todos.push(...newTodos);
  });

  describe('Query', () => {
    it('should get all todos', () => {
      const allTodos = resolvers.Query.getAllTodos();
      expect(allTodos).toHaveLength(3);
    });

    it('should get todos for a specific user', () => {
      const userTodos = resolvers.Query.getTodosByUser(null, { userId: '1' });
      expect(userTodos).toHaveLength(2);
      expect(userTodos.every(todo => todo.userId === '1')).toBe(true);
    });

    it('should get all users', () => {
      const allUsers = resolvers.Query.getAllUsers();
      expect(allUsers).toHaveLength(2);
    });
  });

  describe('Mutation', () => {
    it('should add a new todo', () => {
      const newTodo = resolvers.Mutation.addTodo(null, { userId: '1', text: 'New Todo' });
      expect(newTodo.text).toBe('New Todo');
      expect(newTodo.completed).toBe(false);
      const allTodos = resolvers.Query.getAllTodos();
      expect(allTodos).toHaveLength(4);
    });

    it('should update a todo', () => {
      const updatedTodo = resolvers.Mutation.updateTodo(null, { id: '1' });
      expect(updatedTodo.completed).toBe(true);
    });

    it('should delete a todo', () => {
      const deletedTodo = resolvers.Mutation.deleteTodo(null, { id: '1' });
      expect(deletedTodo.id).toBe('1');
      const allTodos = resolvers.Query.getAllTodos();
      expect(allTodos).toHaveLength(2);
    });

    it('should add a new user', () => {
      const newUser = resolvers.Mutation.addUser(null, { username: 'Test User', email: 'test@user.com' });
      expect(newUser.username).toBe('Test User');
      const allUsers = resolvers.Query.getAllUsers();
      expect(allUsers).toHaveLength(3);
    });
  });

  describe('Nested Resolvers', () => {
    it("should get a user's todos", () => {
      const user = { id: '1' };
      const result = resolvers.User.todos(user);
      expect(result).toEqual(todos.filter(todo => todo.userId === '1'));
    });

    it("should get a todo's user", () => {
      const todo = { userId: '1' };
      const result = resolvers.Todo.user(todo);
      expect(result).toEqual(users.find(user => user.id === '1'));
    });
  });
});