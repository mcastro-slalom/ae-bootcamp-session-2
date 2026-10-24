# Functional Requirements

This document defines the core functional requirements for the TODO app.

## Task Management

- **FR-1: View tasks.** The app shall load and display the current task list when opened. Each task shall have a unique identifier and a name.
- **FR-2: Add a task.** The app shall allow a user to submit a task name and display the newly created task in the list after successful creation.
- **FR-3: Validate task names.** The app shall reject missing, empty, or whitespace-only task names and provide a clear indication that a name is required.
- **FR-4: Delete a task.** The app shall allow a user to delete an existing task and remove it from the displayed list after successful deletion.

## User Feedback

- **FR-5: Show loading state.** While the task list is being fetched, the app shall indicate that it is loading.
- **FR-6: Show empty state.** When there are no tasks, the app shall indicate that the list is empty and invite the user to add a task.
- **FR-7: Show operation errors.** If loading, creating, or deleting a task fails, the app shall display an error message and keep the interface usable.