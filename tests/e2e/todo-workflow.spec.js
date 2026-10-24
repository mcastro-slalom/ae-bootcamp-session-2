const { test: base, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

const test = base.extend({
  todoPage: async ({ page }, use) => {
    await use(new TodoPage(page));
  },
  taskNames: async ({}, use) => {
    await use([]);
  },
});

test.afterEach(async ({ request, taskNames }) => {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3030';
  const response = await request.get(`${backendUrl}/api/items`);
  if (!response.ok()) return;

  const tasks = await response.json();
  for (const task of tasks) {
    if (taskNames.includes(task.name)) {
      await request.delete(`${backendUrl}/api/items/${task.id}`);
    }
  }
});

function uniqueTaskName(testInfo, label) {
  return `${label} ${testInfo.workerIndex}-${testInfo.retry}-${Date.now()}`;
}

test('creates a task and rejects an empty name', async ({ todoPage, taskNames }, testInfo) => {
  await todoPage.open();
  await todoPage.page.getByRole('button', { name: 'Add task' }).click();
  await expect(todoPage.page.getByRole('alert')).toHaveText('A task name is required.');

  const taskName = uniqueTaskName(testInfo, 'Create task');
  taskNames.push(taskName);
  await todoPage.addTask(taskName);
});

test('completes and reopens a task', async ({ todoPage, taskNames }, testInfo) => {
  await todoPage.open();
  const taskName = uniqueTaskName(testInfo, 'Toggle task');
  taskNames.push(taskName);
  await todoPage.addTask(taskName);

  await todoPage.setCompleted(taskName);
  await expect(todoPage.page.getByRole('checkbox', { name: `Reopen ${taskName}` })).toBeChecked();
  await todoPage.setCompleted(taskName, false);
  await expect(todoPage.page.getByRole('checkbox', { name: `Complete ${taskName}` })).not.toBeChecked();
});

test('edits a task name', async ({ todoPage, taskNames }, testInfo) => {
  await todoPage.open();
  const originalName = uniqueTaskName(testInfo, 'Edit task');
  const updatedName = `${originalName} updated`;
  taskNames.push(originalName, updatedName);
  await todoPage.addTask(originalName);
  await todoPage.editTask(originalName, updatedName);
  await expect(todoPage.task(originalName)).toHaveCount(0);
});

test('filters active and completed tasks', async ({ todoPage, taskNames }, testInfo) => {
  await todoPage.open();
  const activeName = uniqueTaskName(testInfo, 'Active task');
  const completedName = uniqueTaskName(testInfo, 'Completed task');
  taskNames.push(activeName, completedName);
  await todoPage.addTask(activeName);
  await todoPage.addTask(completedName);
  await todoPage.setCompleted(completedName);

  await todoPage.filterBy('Completed');
  await expect(todoPage.task(completedName)).toBeVisible();
  await expect(todoPage.task(activeName)).toHaveCount(0);

  await todoPage.filterBy('Active');
  await expect(todoPage.task(activeName)).toBeVisible();
  await expect(todoPage.task(completedName)).toHaveCount(0);
});

test('deletes a task', async ({ todoPage, taskNames }, testInfo) => {
  await todoPage.open();
  const taskName = uniqueTaskName(testInfo, 'Delete task');
  taskNames.push(taskName);
  await todoPage.addTask(taskName);
  await todoPage.deleteTask(taskName);
});

test('keeps tasks visible after reloading the app', async ({ todoPage, taskNames }, testInfo) => {
  await todoPage.open();
  const taskName = uniqueTaskName(testInfo, 'Persistent task');
  taskNames.push(taskName);
  await todoPage.addTask(taskName);
  await todoPage.page.reload();
  await expect(todoPage.task(taskName)).toBeVisible();
});