const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const { db: defaultDb, createApp } = require('../src/app');

let testDatabase;

afterEach(() => {
  if (testDatabase) {
    testDatabase.close();
    testDatabase = null;
  }
});

afterAll(() => defaultDb.close());

describe('database initialization', () => {
  test('creates the task schema with incomplete as the default state', () => {
    testDatabase = createApp({ databasePath: ':memory:' }).db;
    const columns = testDatabase.pragma('table_info(items)').map(column => column.name);
    const item = testDatabase.prepare('INSERT INTO items (name) VALUES (?)').run('Unit test task');
    const savedItem = testDatabase.prepare('SELECT * FROM items WHERE id = ?').get(item.lastInsertRowid);

    expect(columns).toEqual(expect.arrayContaining(['id', 'name', 'created_at', 'completed']));
    expect(savedItem.completed).toBe(0);
  });

  test('adds the completion field to an existing database without losing tasks', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-migration-'));
    const databasePath = path.join(directory, 'tasks.sqlite');
    const legacyDatabase = new Database(databasePath);
    legacyDatabase.exec(`
      CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    legacyDatabase.prepare('INSERT INTO items (name) VALUES (?)').run('Existing task');
    legacyDatabase.close();

    testDatabase = createApp({ databasePath }).db;
    const migratedItem = testDatabase.prepare('SELECT * FROM items').get();

    expect(migratedItem.name).toBe('Existing task');
    expect(migratedItem.completed).toBe(0);

    testDatabase.close();
    testDatabase = null;
    fs.rmSync(directory, { recursive: true, force: true });
  });
});
