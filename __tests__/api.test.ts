import request from 'supertest';
import { createServer } from '../src/server';
import { ErrorMessage } from '../src/helpers/enums.ts';
import { resetDataFile } from '../src/helpers/fs.helper.ts';

const app = createServer();

describe('Users CRUD API tests', () => {
  let createdUserId: string;

  afterAll(async () => {
    app.close();
  });

  it('should return an empty array when getting all users', async () => {
    await resetDataFile();

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should create a new user and return it', async () => {
    const newUser = {
      username: 'testuser',
      age: 30,
      hobbies: ['reading', 'gaming'],
    };

    const response = await request(app).post('/api/users').send(newUser);
    createdUserId = response.body.id;

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(newUser.username);
    expect(response.body.age).toBe(newUser.age);
    expect(response.body.hobbies).toEqual(newUser.hobbies);
  });

  it('should get the created user by ID', async () => {
    const response = await request(app).get(`/api/users/${createdUserId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', createdUserId);
  });

  it('should update the created user and return the updated object', async () => {
    const updatedUser = {
      username: 'updateduser',
      age: 35,
      hobbies: ['traveling'],
    };

    const response = await request(app)
      .put(`/api/users/${createdUserId}`)
      .send(updatedUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', createdUserId);
    expect(response.body.username).toBe(updatedUser.username);
  });

  it('should delete the created user by ID', async () => {
    const response = await request(app).delete(`/api/users/${createdUserId}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 when trying to get a deleted user by ID', async () => {
    const response = await request(app).get(`/api/users/${createdUserId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: ErrorMessage.USER_NOT_FOUNT });
  });
});
