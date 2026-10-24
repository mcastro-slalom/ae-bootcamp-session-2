# UI Guidelines

These guidelines shape the TODO app into a focused, accessible task manager. The interface is built with React and should support the current task workflow: view, add, and delete tasks.

## Product Benchmark

The following patterns were reviewed in public product and help pages. They inform the app's interaction priorities, not its branding or feature scope.

| App | Observed pattern | What fits this app |
| --- | --- | --- |
| [Todoist](https://todoist.com/features) | Quick Add makes task entry a prominent, direct action; reminders and date entry are available for richer planning. | Keep task entry immediately visible and fast. Natural-language dates and reminders are outside the current scope. |
| [Microsoft To Do](https://www.microsoft.com/en-us/microsoft-365/microsoft-to-do-list-app) | Tasks are organized around lists, with a daily planning view and optional due dates and reminders. | Make the current task list the primary content. Defer daily planning, dates, and reminders until requirements call for them. |
| [Google Tasks](https://support.google.com/tasks/answer/7675772) | Due dates and notifications support time-sensitive tasks. | Keep optional scheduling features out of the core interface for now; preserve a simple list that is easy to scan. |

The common lesson is to make the task list and task capture obvious, while keeping planning features secondary. Completion, editing, and status filters are in the current scope; scheduling, labels, and reminders remain deferred unless the functional requirements are expanded.

## Visual Direction

- Use a calm, light interface with a green primary action, neutral surfaces, dark readable text, and a distinct red for destructive or error states. Avoid using color as the only way to communicate meaning.
- Define and reuse CSS custom properties for the following palette:

| Token | Suggested value | Use |
| --- | --- | --- |
| `--color-page` | `#F4F7F5` | Page background |
| `--color-surface` | `#FFFFFF` | Main content surface and input background |
| `--color-text` | `#17211B` | Headings and primary text |
| `--color-text-muted` | `#53635A` | Supporting text |
| `--color-border` | `#78877F` | Input outlines and important boundaries |
| `--color-primary` | `#146B54` | Primary action |
| `--color-primary-hover` | `#0D5945` | Primary action hover/pressed state |
| `--color-danger` | `#B42318` | Delete action and error text |
| `--color-focus` | `#005FCC` | Keyboard focus indicator |

- The suggested text and action colors meet WCAG AA contrast for normal text on white or the page background. Keep text at or above 4.5:1 contrast and large text at or above 3:1. Verify any new foreground/background pairing rather than assuming palette tokens are interchangeable.
- Use restrained borders and surfaces to group the add form and task list. Avoid nested cards, heavy shadows, decorative gradients, or large empty hero areas; this is a repeat-use utility.
- Use a consistent spacing scale and compact typography. Task names should be easy to scan, with a clear heading hierarchy and enough row spacing to avoid accidental deletion.

## Controls and Interaction

- Keep the add-task form near the top of the task list. Use a visible label, a text input, and a clearly labeled primary button such as “Add task.” The placeholder may provide an example, but must not replace the label.
- Use native React-rendered HTML controls (`form`, `label`, `input`, `button`, and list markup) so standard browser keyboard and accessibility behavior is preserved.
- Make the primary action visually distinct from secondary actions. Style delete as a destructive action, but do not make it the most visually prominent control. Use concise text labels for actions; icon-only controls need an accessible name and a tooltip.
- Provide hover, pressed, disabled, and keyboard-focus states. Do not remove the browser focus indicator without replacing it with a clearly visible one.
- Submit the form with Enter as well as by activating the button. Keep keyboard tab order aligned with the visual order, and ensure every action is available without a pointer.
- Aim for touch targets of at least 44 by 44 CSS pixels where practical. Keep controls usable at narrow mobile widths without horizontal scrolling.
- After adding or deleting a task, update the visible list and provide clear feedback. Keep loading, empty, and error states visually distinct and understandable.
- Use a labeled checkbox to complete or reopen a task. Pair the checked state with a non-color cue such as a checkmark and/or strikethrough.
- Keep task editing explicit, with clear Save and Cancel actions. Preserve the draft if saving fails.
- Present All, Active, and Completed as a compact filter group. Expose the selected filter state programmatically, and keep task counts secondary to the filter labels.

## Accessibility

- Use one descriptive page-level heading, meaningful section headings, semantic lists, and explicit labels for form controls.
- Meet WCAG 2.2 AA contrast requirements: at least 4.5:1 for normal text and 3:1 for large text. Ensure important control boundaries and focus indicators are distinguishable from adjacent colors.
- Make keyboard focus clearly visible and preserve a logical focus order. When an operation removes a focused control (such as deleting a task), keep focus in a predictable, usable location.
- Associate validation and operation errors with the relevant control or status region. Announce asynchronous loading and result messages to assistive technology using appropriate live-region semantics; do not rely on color alone.
- Give each repeated delete control an accessible name that identifies its task, for example “Delete Buy groceries.”
- Respect reduced-motion preferences if motion is added. Avoid animation that delays task entry or obscures a changed list.

## Responsive and React Implementation

- Use a single-column layout on small screens and a readable constrained content width on larger screens. Let task names wrap without pushing action buttons off-screen.
- Use CSS custom properties for shared design tokens and retain the project's existing React and CSS setup. Add a component or dependency only when it meaningfully improves reuse or accessibility.
- Keep interaction state and visible feedback in step with API results. Preserve entered text when an add request fails so the user can retry.

## References

- [Todoist features](https://todoist.com/features)
- [Microsoft To Do](https://www.microsoft.com/en-us/microsoft-365/microsoft-to-do-list-app)
- [Google Tasks Help: Learn about Google Tasks](https://support.google.com/tasks/answer/7675772)
- [W3C WCAG 2.2: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C WCAG 2.2: Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)