import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

async function requestJson(url, options) {
  const response = await fetch(`${API_BASE_URL}${url}`, options);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Request failed. Please try again.');
  }
  return result;
}

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const taskListHeadingRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      try {
        const result = await requestJson('/api/items');
        if (isMounted) {
          setItems(result);
          setLoadError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setLoadError('Unable to load tasks. Try again later.');
          console.error('Error fetching tasks:', requestError);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadItems();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newItem.trim()) {
      setError('A task name is required.');
      return;
    }

    try {
      const result = await requestJson('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItem.trim() }),
      });
      setItems(currentItems => [result, ...currentItems]);
      setNewItem('');
      setError(null);
    } catch (requestError) {
      setError(`Unable to add task: ${requestError.message}`);
      console.error('Error adding task:', requestError);
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      const updatedItem = await requestJson(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !item.completed }),
      });
      setItems(currentItems => currentItems.map(currentItem => (
        currentItem.id === item.id ? updatedItem : currentItem
      )));
      setError(null);
    } catch (requestError) {
      setError(`Unable to update task: ${requestError.message}`);
      console.error('Error updating task:', requestError);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setError(null);
  };

  const handleSaveEdit = async (event, itemId) => {
    event.preventDefault();
    if (!editName.trim()) {
      setError('A task name is required.');
      return;
    }

    try {
      const updatedItem = await requestJson(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      setItems(currentItems => currentItems.map(item => (
        item.id === itemId ? updatedItem : item
      )));
      setEditingId(null);
      setEditName('');
      setError(null);
    } catch (requestError) {
      setError(`Unable to save task: ${requestError.message}`);
      console.error('Error saving task:', requestError);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await requestJson(`/api/items/${itemId}`, { method: 'DELETE' });
      setItems(currentItems => currentItems.filter(item => item.id !== itemId));
      if (editingId === itemId) {
        setEditingId(null);
        setEditName('');
      }
      taskListHeadingRef.current?.focus();
      setError(null);
    } catch (requestError) {
      setError(`Unable to delete task: ${requestError.message}`);
      console.error('Error deleting task:', requestError);
    }
  };

  const visibleItems = items.filter(item => {
    if (filter === 'active') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });
  const filterOptions = [
    { id: 'all', label: 'All', count: items.length },
    { id: 'active', label: 'Active', count: items.filter(item => !item.completed).length },
    { id: 'completed', label: 'Completed', count: items.filter(item => item.completed).length },
  ];

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of what needs doing.</p>
      </header>

      <main>
        <section className="add-item-section">
          <h2>Add a task</h2>
          <form onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="new-task">Task name</label>
            <input
              id="new-task"
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="What needs doing?"
            />
            <button className="primary-btn" type="submit">Add task</button>
          </form>
        </section>

        <section className="items-section" aria-busy={loading}>
          <div className="list-heading">
            <h2 ref={taskListHeadingRef} tabIndex="-1">Your tasks</h2>
            <span className="task-total">{items.length}</span>
          </div>

          <div className="filters" role="group" aria-label="Filter tasks">
            {filterOptions.map(option => (
              <button
                key={option.id}
                type="button"
                className="filter-btn"
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
              >
                {option.label}<span>{option.count}</span>
              </button>
            ))}
          </div>

          {loading && <p className="status-message" role="status">Loading tasks...</p>}
          {loadError && <p className="error" role="alert">{loadError}</p>}
          {error && <p className="error" role="alert">{error}</p>}

          {!loading && !loadError && visibleItems.length === 0 && (
            <p className="empty-state" role="status">
              {filter === 'all'
                ? 'No tasks yet. Add one above to get started.'
                : `No ${filter} tasks.`}
            </p>
          )}

          {!loading && !loadError && visibleItems.length > 0 && (
            <ul className="task-list" aria-label="Tasks">
              {visibleItems.map(item => (
                <li className={`task-row${item.completed ? ' is-completed' : ''}`} key={item.id}>
                  {editingId === item.id ? (
                    <form className="edit-form" onSubmit={event => handleSaveEdit(event, item.id)}>
                      <label className="sr-only" htmlFor={`edit-task-${item.id}`}>
                        Task name for {item.name}
                      </label>
                      <input
                        id={`edit-task-${item.id}`}
                        autoFocus
                        value={editName}
                        onChange={event => setEditName(event.target.value)}
                      />
                      <button type="submit" className="small-btn">Save</button>
                      <button
                        type="button"
                        className="small-btn secondary-btn"
                        onClick={() => {
                          setEditingId(null);
                          setEditName('');
                          setError(null);
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <label className="completion-control">
                        <input
                          type="checkbox"
                          checked={Boolean(item.completed)}
                          onChange={() => handleToggleComplete(item)}
                          aria-label={`${item.completed ? 'Reopen' : 'Complete'} ${item.name}`}
                        />
                        <span className="task-name">{item.name}</span>
                      </label>
                      <div className="task-actions">
                        <button
                          type="button"
                          className="small-btn secondary-btn"
                          onClick={() => startEditing(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="small-btn delete-btn"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Delete ${item.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;