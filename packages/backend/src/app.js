const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function getDefaultDatabasePath() {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  if (process.env.NODE_ENV === 'test') {
    return ':memory:';
  }

  return path.join(__dirname, '..', 'data', 'todos.sqlite');
}

function createDatabase(databasePath) {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const database = new Database(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const columns = database.pragma('table_info(items)');
  if (!columns.some(column => column.name === 'completed')) {
    database.exec('ALTER TABLE items ADD COLUMN completed INTEGER NOT NULL DEFAULT 0');
  }

  return database;
}

function parseTaskId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function serializeTask(task) {
  return { ...task, completed: Boolean(task.completed) };
}

function createApp({ databasePath = getDefaultDatabasePath() } = {}) {
  const db = createDatabase(databasePath);
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend server is running' });
  });

  app.get('/api/items', (req, res) => {
    try {
      const { status = 'all' } = req.query;
      if (!['all', 'active', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Status must be all, active, or completed' });
      }

      const query = status === 'all'
        ? db.prepare('SELECT * FROM items ORDER BY id DESC')
        : db.prepare('SELECT * FROM items WHERE completed = ? ORDER BY id DESC');
      const items = status === 'all'
        ? query.all()
        : query.all(status === 'completed' ? 1 : 0);

      res.json(items.map(serializeTask));
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  });

  app.post('/api/items', (req, res) => {
    try {
      const { name } = req.body;
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Item name is required' });
      }

      const result = db.prepare('INSERT INTO items (name) VALUES (?)').run(name.trim());
      const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(serializeTask(newItem));
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  app.patch('/api/items/:id', (req, res) => {
    try {
      const id = parseTaskId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: 'Valid item ID is required' });
      }

      const body = req.body || {};
      const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
      const hasCompleted = Object.prototype.hasOwnProperty.call(body, 'completed');
      if (!hasName && !hasCompleted) {
        return res.status(400).json({ error: 'A name or completion state is required' });
      }
      if (hasName && (typeof body.name !== 'string' || body.name.trim() === '')) {
        return res.status(400).json({ error: 'Item name is required' });
      }
      if (hasCompleted && typeof body.completed !== 'boolean') {
        return res.status(400).json({ error: 'Completion state must be a boolean' });
      }

      const existingItem = db.prepare('SELECT id FROM items WHERE id = ?').get(id);
      if (!existingItem) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const updates = [];
      const values = [];
      if (hasName) {
        updates.push('name = ?');
        values.push(body.name.trim());
      }
      if (hasCompleted) {
        updates.push('completed = ?');
        values.push(body.completed ? 1 : 0);
      }

      db.prepare(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`).run(...values, id);
      const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
      res.json(serializeTask(updatedItem));
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  app.delete('/api/items/:id', (req, res) => {
    try {
      const id = parseTaskId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: 'Valid item ID is required' });
      }

      const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json({ message: 'Item deleted successfully', id });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  return { app, db };
}

const { app, db } = createApp();

module.exports = { app, db, createApp };