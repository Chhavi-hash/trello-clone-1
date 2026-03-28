# Bugfix Requirements Document

## Introduction

The kanban board's drag-and-drop functionality has multiple defects that prevent cards and lists from being reordered or moved correctly. These bugs span both the frontend DnD logic (using `@dnd-kit`) and API call signatures in the React components. The issues cause cards to disappear during cross-list drags, list reordering to fail silently, card creation to break, and clicking a card to open its modal to be unreliable due to drag listener conflicts.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a card is dragged from one list to another THEN the system loses track of the card's source list on subsequent `onDragOver` events, causing the card to disappear or duplicate in the UI

1.2 WHEN a card is dropped onto an empty list or the list container (not onto another card) THEN the system calculates an incorrect target index, leaving the card at the wrong visual position

1.3 WHEN a user clicks a card to open the card modal THEN the system intercepts the click via drag listeners on the same element, making the modal unreliable to open

1.4 WHEN the "Add a card" form is submitted THEN the system calls `createCard` with a single merged object instead of `(listId, data)`, causing the API request to fail with a missing `list_id` parameter

1.5 WHEN the "Add another list" form is submitted THEN the system calls `createList` with a single merged object instead of `(boardId, data)`, causing the API request to fail with a missing board ID

1.6 WHEN a list is dragged to position 1 (the first position) THEN the system may reject the reorder request because the backend validation uses a falsy check (`!newPosition`) which incorrectly treats position `1` as invalid in edge cases near `0`

### Expected Behavior (Correct)

2.1 WHEN a card is dragged from one list to another THEN the system SHALL track the card's current list correctly across all `onDragOver` events and move it smoothly without duplication or disappearance

2.2 WHEN a card is dropped onto an empty list or the list container THEN the system SHALL place the card at the correct last position in that list

2.3 WHEN a user clicks a card THEN the system SHALL reliably open the card modal without the drag listeners blocking the click event

2.4 WHEN the "Add a card" form is submitted THEN the system SHALL call `createCard(listId, { title, performed_by })` with the correct two-argument signature so the API request succeeds

2.5 WHEN the "Add another list" form is submitted THEN the system SHALL call `createList(boardId, { title })` with the correct two-argument signature so the API request succeeds

2.6 WHEN a list is dragged to any valid position THEN the system SHALL send the correct `newPosition` value and the backend SHALL accept all valid positive integer positions

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a card is dragged and reordered within the same list THEN the system SHALL CONTINUE TO reorder cards correctly and persist the new position via the `moveCard` API

3.2 WHEN a list is dragged to a new position among other lists THEN the system SHALL CONTINUE TO reorder lists correctly and persist the new position via the `reorderList` API

3.3 WHEN a card modal is open and the user makes changes THEN the system SHALL CONTINUE TO update the card and reflect changes in the board view

3.4 WHEN a card or list is deleted THEN the system SHALL CONTINUE TO remove it from the UI and the backend correctly

3.5 WHEN the board page loads THEN the system SHALL CONTINUE TO fetch and display all lists and cards in their persisted order
