const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { db: defaultDb, createApp } = require('../../src/app');

let testServer;

beforeEach(() => {
  testServer = createApp({ databasePath: ':memory:' });
});

afterEach(() => {
  testServer.db.close();
});

afterAll(() => {
  defaultDb.close();
});

const createItem = async (name = 'Temp Item to Delete') => {
  const response = await request(testServer.app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('returns an empty list when no items exist', async () => {
      const response = await request(testServer.app).get('/api/items');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('filters active and completed items', async () => {
      const active = await createItem('Active task');
      const completed = await createItem('Completed task');
      await request(testServer.app)
        .patch(`/api/items/${completed.id}`)
        .send({ completed: true });

      const activeResponse = await request(testServer.app).get('/api/items?status=active');
      const completedResponse = await request(testServer.app).get('/api/items?status=completed');

      expect(activeResponse.body.map(item => item.id)).toContain(active.id);
      expect(activeResponse.body.map(item => item.id)).not.toContain(completed.id);
      expect(completedResponse.body.map(item => item.id)).toContain(completed.id);
      expect(completedResponse.body[0].completed).toBe(true);
    });

    it('rejects an unsupported status filter', async () => {
      const response = await request(testServer.app).get('/api/items?status=archived');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(testServer.app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body).toHaveProperty('created_at');
      expect(response.body.completed).toBe(false);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(testServer.app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(testServer.app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });
  });

  describe('PATCH /api/items/:id', () => {
    it('updates a task name and completion state', async () => {
      const item = await createItem('Old task');
      const response = await request(testServer.app)
        .patch(`/api/items/${item.id}`)
        .send({ name: '  Renamed task  ', completed: true });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: item.id,
        name: 'Renamed task',
        completed: true,
      });
    });

    it('reopens a completed task', async () => {
      const item = await createItem('Task');
      await request(testServer.app).patch(`/api/items/${item.id}`).send({ completed: true });

      const response = await request(testServer.app)
        .patch(`/api/items/${item.id}`)
        .send({ completed: false });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
    });

    it('rejects empty names and non-boolean completion values', async () => {
      const item = await createItem();
      const emptyName = await request(testServer.app)
        .patch(`/api/items/${item.id}`)
        .send({ name: '  ' });
      const invalidCompletion = await request(testServer.app)
        .patch(`/api/items/${item.id}`)
        .send({ completed: 'true' });

      expect(emptyName.status).toBe(400);
      expect(invalidCompletion.status).toBe(400);
    });

    it('returns 404 for a missing task', async () => {
      const response = await request(testServer.app)
        .patch('/api/items/999999')
        .send({ completed: true });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(testServer.app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(testServer.app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(testServer.app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(testServer.app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });

  it('persists tasks when the database connection is reopened', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-api-'));
    const databasePath = path.join(directory, 'tasks.sqlite');
    const firstServer = createApp({ databasePath });
    const created = await request(firstServer.app).post('/api/items').send({ name: 'Persistent task' });
    firstServer.db.close();

    const reopenedServer = createApp({ databasePath });
    const listed = await request(reopenedServer.app).get('/api/items');
    reopenedServer.db.close();
    fs.rmSync(directory, { recursive: true, force: true });

    expect(created.status).toBe(201);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({ name: 'Persistent task', completed: false });
  });
});