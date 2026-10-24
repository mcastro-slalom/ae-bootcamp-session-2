const { expect } = require('@playwright/test');

class TodoPage {
  constructor(page) {
    this.page = page;
    this.taskInput = page.getByLabel('Task name');
  }

  async open() {
    await this.page.goto('/');
    await expect(this.page.locator('.items-section')).toHaveAttribute('aria-busy', 'false');
  }

  async addTask(name) {
    await this.taskInput.fill(name);
    await this.page.getByRole('button', { name: 'Add task' }).click();
    await expect(this.page.getByText(name, { exact: true })).toBeVisible();
  }

  task(name) {
    return this.page.getByText(name, { exact: true });
  }

  async setCompleted(name, completed = true) {
    const action = completed ? 'Complete' : 'Reopen';
    await this.page.getByRole('checkbox', { name: `${action} ${name}` }).click();
  }

  async filterBy(status) {
    await this.page.getByRole('group', { name: 'Filter tasks' })
      .getByRole('button', { name: status, exact: false })
      .click();
  }

  async editTask(oldName, newName) {
    await this.page.getByRole('button', { name: `Edit ${oldName}` }).click();
    const input = this.page.getByRole('textbox', { name: `Task name for ${oldName}` });
    await input.fill(newName);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.task(newName)).toBeVisible();
  }

  async deleteTask(name) {
    await this.page.getByRole('button', { name: `Delete ${name}` }).click();
    await expect(this.task(name)).toHaveCount(0);
  }
}

module.exports = { TodoPage };