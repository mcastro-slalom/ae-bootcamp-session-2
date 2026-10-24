import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let tasks;

const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    const status = req.url.searchParams.get('status') || 'all';
    const filteredTasks = tasks.filter(task => (
      status === 'all' || (status === 'completed' ? task.completed : !task.completed)
    ));
    return res(ctx.status(200), ctx.json(filteredTasks));
  }),
  rest.post('/api/items', async (req, res, ctx) => {
    const { name } = await req.json();
    if (!name || !name.trim()) {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }

    const task = {
      id: tasks.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1,
      name: name.trim(),
      completed: false,
      created_at: new Date().toISOString(),
    };
    tasks.unshift(task);
    return res(ctx.status(201), ctx.json(task));
  }),
  rest.patch('/api/items/:id', async (req, res, ctx) => {
    const task = tasks.find(item => item.id === Number(req.params.id));
    if (!task) return res(ctx.status(404), ctx.json({ error: 'Item not found' }));

    const updates = await req.json();
    Object.assign(task, updates);
    return res(ctx.status(200), ctx.json(task));
  }),
  rest.delete('/api/items/:id', (req, res, ctx) => {
    tasks = tasks.filter(item => item.id !== Number(req.params.id));
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully' }));
  })
);

beforeAll(() => server.listen());
beforeEach(() => {
  tasks = [
    { id: 1, name: 'Test Item 1', completed: false, created_at: '2023-01-01T00:00:00.000Z' },
    { id: 2, name: 'Test Item 2', completed: false, created_at: '2023-01-02T00:00:00.000Z' },
  ];
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function interact(action) {
  await act(async () => action());
}

describe('App component', () => {
  test('loads and displays tasks', async () => {
    render(<App />);

    expect(await screen.findByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Filter tasks' })).toBeInTheDocument();
  });

  test('adds a task and rejects a blank task name', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText('Task name');
    await interact(() => user.type(input, 'New task'));
    await interact(() => user.click(screen.getByRole('button', { name: 'Add task' })));

    expect(await screen.findByText('New task')).toBeInTheDocument();
    expect(input).toHaveValue('');

    await interact(() => user.click(screen.getByRole('button', { name: 'Add task' })));
    expect(screen.getByRole('alert')).toHaveTextContent('A task name is required.');
  });

  test('completes and reopens a task, and filters the list', async () => {
    const user = userEvent.setup();
    render(<App />);

    const completionControl = await screen.findByRole('checkbox', { name: 'Complete Test Item 1' });
    await interact(() => user.click(completionControl));
    expect(await screen.findByRole('checkbox', { name: 'Reopen Test Item 1' })).toBeChecked();

    await interact(() => user.click(screen.getByRole('button', { name: /Completed/ })));
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Item 2')).not.toBeInTheDocument();

    await interact(() => user.click(screen.getByRole('checkbox', { name: 'Reopen Test Item 1' })));
    await interact(() => user.click(screen.getByRole('button', { name: /Active/ })));
    expect(await screen.findByRole('checkbox', { name: 'Complete Test Item 1' })).not.toBeChecked();
  });

  test('edits a task name', async () => {
    const user = userEvent.setup();
    render(<App />);

    const editButton = await screen.findByRole('button', { name: 'Edit Test Item 1' });
    await interact(() => user.click(editButton));
    const editInput = screen.getByRole('textbox', { name: 'Task name for Test Item 1' });
    await interact(() => user.clear(editInput));
    await interact(() => user.type(editInput, 'Updated task'));
    await interact(() => user.click(screen.getByRole('button', { name: 'Save' })));

    expect(await screen.findByText('Updated task')).toBeInTheDocument();
    expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
  });

  test('deletes a task', async () => {
    const user = userEvent.setup();
    render(<App />);

    const deleteButton = await screen.findByRole('button', { name: 'Delete Test Item 1' });
    await interact(() => user.click(deleteButton));

    await waitFor(() => expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument());
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your tasks' })).toHaveFocus();
  });

  test('shows an error when loading tasks fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    server.use(rest.get('/api/items', (req, res, ctx) => (
      res(ctx.status(500), ctx.json({ error: 'Failed to fetch items' }))
    )));
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load tasks.');
  });

  test('shows an empty state when no tasks exist', async () => {
    tasks = [];
    render(<App />);

    expect(await screen.findByText('No tasks yet. Add one above to get started.')).toBeInTheDocument();
  });
});

afterEach(() => jest.restoreAllMocks());