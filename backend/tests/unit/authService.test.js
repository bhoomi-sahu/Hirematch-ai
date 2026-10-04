const bcrypt = require('bcryptjs');

jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

const { User } = require('../../src/models');
const authService = require('../../src/services/auth.service');

/** Mongoose's findOne() result is awaitable directly AND supports .select() chaining. */
const mockFindOneResult = (resolvedUser) => {
  const promise = Promise.resolve(resolvedUser);
  promise.select = jest.fn().mockResolvedValue(resolvedUser);
  return promise;
};

const makeFakeUserDoc = async (overrides = {}) => {
  const password = overrides.password || 'plaintext123';
  const hashed = await bcrypt.hash(password, 4);
  const doc = {
    _id: 'user123',
    name: overrides.name || 'Jane Doe',
    email: overrides.email || 'jane@example.com',
    role: overrides.role || 'candidate',
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    password: hashed,
    comparePassword: async function (entered) {
      return bcrypt.compare(entered, this.password);
    },
    toJSON: function () {
      const { password, ...rest } = this;
      return rest;
    },
  };
  return doc;
};

describe('authService.registerUser', () => {
  test('creates a new user and returns a signed token', async () => {
    User.findOne.mockReturnValue(mockFindOneResult(null));
    const fakeUser = await makeFakeUserDoc();
    User.create.mockResolvedValue(fakeUser);

    const result = await authService.registerUser({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'plaintext123',
      role: 'candidate',
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user.email).toBe('jane@example.com');
    expect(result.user.password).toBeUndefined();
  });

  test('rejects registration when the email is already taken', async () => {
    const existing = await makeFakeUserDoc();
    User.findOne.mockReturnValue(mockFindOneResult(existing));

    await expect(
      authService.registerUser({ name: 'Jane', email: 'jane@example.com', password: 'plaintext123' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(User.create).not.toHaveBeenCalled();
  });

  test('normalizes email to lowercase before checking/creating', async () => {
    User.findOne.mockReturnValue(mockFindOneResult(null));
    const fakeUser = await makeFakeUserDoc({ email: 'jane@example.com' });
    User.create.mockResolvedValue(fakeUser);

    await authService.registerUser({ name: 'Jane', email: 'JANE@EXAMPLE.COM', password: 'plaintext123' });

    expect(User.findOne).toHaveBeenCalledWith({ email: 'jane@example.com' });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'jane@example.com' }));
  });

  test('defaults role to candidate when not specified', async () => {
    User.findOne.mockReturnValue(mockFindOneResult(null));
    const fakeUser = await makeFakeUserDoc();
    User.create.mockResolvedValue(fakeUser);

    await authService.registerUser({ name: 'Jane', email: 'jane@example.com', password: 'plaintext123' });

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'candidate' }));
  });
});

describe('authService.loginUser', () => {
  test('logs in successfully with correct credentials', async () => {
    const fakeUser = await makeFakeUserDoc({ password: 'correct-password' });
    User.findOne.mockReturnValue(mockFindOneResult(fakeUser));

    const result = await authService.loginUser({ email: 'jane@example.com', password: 'correct-password' });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user.email).toBe('jane@example.com');
  });

  test('rejects login for a non-existent email', async () => {
    User.findOne.mockReturnValue(mockFindOneResult(null));

    await expect(authService.loginUser({ email: 'ghost@example.com', password: 'whatever' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('rejects login with an incorrect password', async () => {
    const fakeUser = await makeFakeUserDoc({ password: 'correct-password' });
    User.findOne.mockReturnValue(mockFindOneResult(fakeUser));

    await expect(authService.loginUser({ email: 'jane@example.com', password: 'wrong-password' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('rejects login for a suspended (inactive) account', async () => {
    const fakeUser = await makeFakeUserDoc({ password: 'correct-password', isActive: false });
    User.findOne.mockReturnValue(mockFindOneResult(fakeUser));

    await expect(authService.loginUser({ email: 'jane@example.com', password: 'correct-password' })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('never returns the password hash in the response', async () => {
    const fakeUser = await makeFakeUserDoc({ password: 'correct-password' });
    User.findOne.mockReturnValue(mockFindOneResult(fakeUser));

    const result = await authService.loginUser({ email: 'jane@example.com', password: 'correct-password' });
    expect(result.user.password).toBeUndefined();
  });
});

describe('authService.getCurrentUser', () => {
  test('returns the user for a valid id', async () => {
    const fakeUser = await makeFakeUserDoc();
    User.findById.mockResolvedValue(fakeUser);

    const result = await authService.getCurrentUser('user123');
    expect(result.email).toBe('jane@example.com');
  });

  test('throws 404 for a non-existent user id', async () => {
    User.findById.mockResolvedValue(null);
    await expect(authService.getCurrentUser('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});
