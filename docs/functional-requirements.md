# Functional Requirements

This document defines the core functional requirements for the TODO app.

## Task Management

- **FR-1: View tasks.** The app shall load and display the current task list when opened. Each task shall have a unique identifier, a name, a completion state, and a creation timestamp.
- **FR-2: Add a task.** The app shall allow a user to submit a task name and display the newly created task in the list after successful creation.
- **FR-3: Validate task names.** The app shall reject missing, empty, or whitespace-only task names and provide a clear indication that a name is required.
- **FR-4: Delete a task.** The app shall allow a user to delete an existing task and remove it from the displayed list after successful deletion.
- **FR-5: Complete and reopen a task.** The app shall allow a user to mark a task complete and return it to active status.
- **FR-6: Edit a task.** The app shall allow a user to change an existing task name and display the updated name after successful saving. Edited names shall follow the same validation rules as new task names.
- **FR-7: Filter tasks.** The app shall allow a user to view all tasks, active tasks, or completed tasks.
- **FR-8: Persist tasks.** Tasks and their completion state shall remain available after the backend process restarts.

## User Feedback

- **FR-9: Show loading state.** While the task list is being fetched, the app shall indicate that it is loading.
- **FR-10: Show empty state.** When the selected view contains no tasks, the app shall explain that it is empty and invite the user to add a task when appropriate.
- **FR-11: Show operation errors.** If loading, creating, updating, or deleting a task fails, the app shall display an error message and keep the interface usable. Failed edits shall preserve the user's input for retry.