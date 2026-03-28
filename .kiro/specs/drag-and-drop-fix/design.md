# Drag-and-Drop Fix Bugfix Design

## Overview

The kanban board has six distinct defects spanning the frontend DnD logic (`Board.jsx`) and two
standalone form components (`AddCard.jsx`, `AddList.jsx`), plus one backend validation edge case
(`listController.js`). The fix strategy is surgical: correct the `onDragOver` state mutation so
it always reads from the latest snapshot, fix the drop-target index calculation for empty lists,
separate the drag handle from the click target on cards, fix the two wrong API call signatures in
the form components, and replace the falsy guard on `newPosition` with an explicit `null`/`undefined`
check in the backend.

## Glossary

- **Bug_Condition (C)**: Any of the six conditions that trigger a defect — wrong API call shape,
  stale closure in `onDragOver`, incorrect drop index, drag-listener click conflict, or falsy
  position guard.
- **Property (P)**: The desired correct behavior for each bug condition — card/list moves persist,
  card creation succeeds, modal opens reliably, position 1 is accepted.
- **Preservation**: All behaviors that must remain unchanged — same-list card reorder, list reorder,
  card modal updates, card/list deletion, board load.
- **onDragOver**: The `@dnd-kit` event handler in `Board.jsx` that runs on every pointer move
  during a drag. It performs optimistic cross-list card moves in React state.
- **onDragEnd**: The `@dnd-kit` event handler in `Board.jsx` that fires once when the drag ends.
  It finalises the UI state and calls the `moveCard` / `reorderList` API.
- **findListOfCard**: Helper in `Board.jsx` that searches `cards` state to find which list owns a
  given card id.
- **createCard / createList**: API functions in `api.js` that take `(id, data)` — two separate
  arguments, not a merged object.
- **reorderList**: Backend controller in `listController.js` that validates `newPosition` before
  updating list order.

## Bug Details

### Bug Condition

Six independent conditions each trigger a defect:

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input — a user interaction event or API call
  OUTPUT: boolean

  RETURN (
    -- Bug 1: stale closure in onDragOver
    (input.type = 'dragOver'
      AND input.crossList = TRUE
      AND stateSnapshotUsed(input) = STALE)

    -- Bug 2: wrong drop index for empty/container target
    OR (input.type = 'dragEnd'
      AND input.overType = 'list'
      AND emptyOrContainerDrop(input) = TRUE)

    -- Bug 3: drag listener blocks card click
    OR (input.type = 'click'
      AND input.target = 'card'
      AND dragListenersOnSameElement(input) = TRUE)

    -- Bug 4: AddCard wrong API signature
    OR (input.type = 'addCard'
      AND callSignature(input) = MERGED_OBJECT)

    -- Bug 5: AddList wrong API signature
    OR (input.type = 'addList'
      AND callSignature(input) = MERGED_OBJECT)

    -- Bug 6: backend rejects position 1
    OR (input.type = 'reorderList'
      AND input.newPosition = 1
      AND backendGuard(input) = FALSY_CHECK)
  )
END FUNCTION
```

### Examples

- **Bug 1**: Drag card from "Todo" to "In Progress", then continue moving over "Testing" — card
  disappears from "In Progress" because `onDragOver` reads stale `cards` state via closure.
- **Bug 2**: Drop a card onto an empty "Done" list — card lands at index `-1` (not found) instead
  of index `0`.
- **Bug 3**: Click a card to open its modal — nothing happens because the `pointerdown` drag
  listener on the same `<div>` consumes the event before React's `onClick` fires.
- **Bug 4**: Submit "Add a card" form — network request goes to `/lists/undefined/cards` because
  `createCard({ list_id, title })` merges args into one object, so `listId` param is `undefined`.
- **Bug 5**: Submit "Add another list" form — network request goes to `/boards/undefined/lists`
  because `createList({ board_id, title })` merges args into one object.
- **Bug 6**: Drag the second list to position 1 — backend returns 400 because `!newPosition`
  evaluates `1` as falsy in the `if (!newPosition)` guard.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Dragging and dropping a card within the same list reorders it correctly and persists via `moveCard`
- Dragging a list to any position other than 1 continues to work and persists via `reorderList`
- Opening a card modal and saving changes continues to update the card and reflect in the board
- Deleting a card or list removes it from the UI and backend correctly
- The board page loads and displays all lists and cards in their persisted order

**Scope:**
All interactions that do NOT involve the six bug conditions above must be completely unaffected.
This includes:
- Same-list card drag-and-drop
- List drag-and-drop to positions 2+
- Card modal open/edit/close via any path that already works
- Board background changes, member/label management, comments, checklist items

## Hypothesized Root Cause

1. **Stale closure in `onDragOver` (Bug 1)**: `onDragOver` calls `findListOfCard(active.id)` which
   reads the `cards` variable captured at render time. After the first cross-list move updates
   state, subsequent `onDragOver` calls still see the old `cards` snapshot, so `findListOfCard`
   returns the original source list and the card is moved back, causing it to vanish.
   Fix: use the functional `setCards(prev => ...)` form and derive `activeList` from `prev` inside
   the updater, or use a `useRef` to always hold the latest cards.

2. **Wrong drop index for empty/container target (Bug 2)**: In `onDragEnd`, when `over` is a list
   container (`over.data.current?.type === 'list'`), `newIdx` is set to `listCards.length - 1`.
   If the list is empty that is `-1`; if the card was just moved there optimistically it is `0`
   but the intent is to append. The correct value is `listCards.length` (append after last item).

3. **Drag listeners block click (Bug 3)**: `SortableCard` spreads `{...attributes} {...listeners}`
   directly onto the outer card `<div>` which also has `onClick`. The `@dnd-kit` `PointerSensor`
   with `distance: 5` still attaches a `pointerdown` listener that can swallow short taps.
   Fix: move `{...listeners}` to a dedicated drag-handle element (e.g. the card header area) so
   the rest of the card surface receives clicks normally.

4. **Wrong `createCard` call signature (Bug 4)**: `AddCard.jsx` calls
   `createCard({ list_id: listId, title, position: Date.now() })` — a single object — but
   `api.js` defines `createCard = (listId, data) => ...`. The `listId` URL param becomes
   `undefined`. Fix: call `createCard(listId, { title, performed_by })`.

5. **Wrong `createList` call signature (Bug 5)**: `AddList.jsx` calls
   `createList({ board_id: boardId, title, position: Date.now() })` — a single object — but
   `api.js` defines `createList = (boardId, data) => ...`. Fix: call `createList(boardId, { title })`.

6. **Falsy guard rejects position 1 (Bug 6)**: `listController.js` uses `if (!newPosition)` to
   validate the incoming value. In JavaScript `!1 === false` so position 1 passes, but the intent
   was to reject `0`, `null`, and `undefined`. However, if a list is dragged to index 0 in the
   array and `newIdx + 1` evaluates to `1`, the guard is fine numerically — the real risk is
   `newPosition = 0` being sent. Regardless, the guard should be
   `if (newPosition == null || newPosition < 1)` to be explicit and safe.

## Correctness Properties

Property 1: Bug Condition - All Six Defects Are Resolved

_For any_ user interaction where the bug condition holds (isBugCondition returns true), the fixed
code SHALL produce the correct outcome: cross-list drags track the card without duplication or
disappearance; drops onto empty lists place the card at position 0; card clicks reliably open the
modal; "Add a card" and "Add another list" submissions succeed with correct API calls; and the
backend accepts `newPosition = 1` for list reordering.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - Non-Buggy Interactions Are Unchanged

_For any_ interaction where the bug condition does NOT hold (isBugCondition returns false), the
fixed code SHALL produce exactly the same behavior as the original code, preserving same-list card
reordering, list reordering to positions 2+, card modal updates, card/list deletion, and board
load behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `frontend/src/components/AddCard.jsx`

**Function**: `submit`

**Specific Changes**:
1. **Fix API call signature**: Replace `createCard({ list_id: listId, title, position: Date.now() })`
   with `createCard(listId, { title, performed_by: undefined })` to match the two-argument API
   function signature.

---

**File**: `frontend/src/components/AddList.jsx`

**Function**: `submit`

**Specific Changes**:
1. **Fix API call signature**: Replace `createList({ board_id: boardId, title, position: Date.now() })`
   with `createList(boardId, { title })` to match the two-argument API function signature.

---

**File**: `frontend/src/pages/Board.jsx`

**Function**: `onDragOver`

**Specific Changes**:
1. **Fix stale closure**: Derive `activeList` from `prev` inside the `setCards` functional updater
   instead of calling `findListOfCard` (which closes over stale state). Read the source list id
   from `active.data.current.sortable.containerId` or scan `prev` directly.

**Function**: `onDragEnd`

**Specific Changes**:
2. **Fix drop index for empty/container target**: Change `newIdx` calculation when
   `over.data.current?.type === 'list'` from `listCards.length - 1` to `listCards.length` so the
   card is appended correctly regardless of whether the list is empty.

**Component**: `SortableCard`

**Specific Changes**:
3. **Separate drag handle from click target**: Move `{...listeners}` off the outer card `<div>`
   onto a dedicated inner drag-handle element. Keep `{...attributes}` on the outer div for
   accessibility. The outer div retains `onClick` so clicks on the card body open the modal.

---

**File**: `backend/src/controllers/listController.js`

**Function**: `reorderList`

**Specific Changes**:
1. **Fix falsy position guard**: Replace `if (!newPosition)` with
   `if (newPosition == null || newPosition < 1)` to correctly reject missing or zero values
   without incorrectly rejecting position `1`.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate
each bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug BEFORE implementing the fix. Confirm
or refute the root cause analysis.

**Test Plan**: Write unit/integration tests that simulate each bug scenario and assert the correct
outcome. Run on UNFIXED code to observe failures and confirm root causes.

**Test Cases**:
1. **Cross-list drag stale closure test**: Simulate two sequential `onDragOver` events moving a
   card from list A → B → C; assert card ends up in C (will fail on unfixed code — card vanishes).
2. **Empty list drop index test**: Simulate `onDragEnd` with `over` being an empty list container;
   assert `moveCard` is called with `newPosition: 1` (will fail — called with `0`).
3. **Card click vs drag test**: Simulate a short pointer tap on a `SortableCard`; assert `onClick`
   fires (will fail on unfixed code — drag listener consumes the event).
4. **AddCard API signature test**: Call `AddCard`'s `submit` and assert `createCard` is called
   with `(listId, { title })` — two args (will fail — called with one merged object).
5. **AddList API signature test**: Call `AddList`'s `submit` and assert `createList` is called
   with `(boardId, { title })` — two args (will fail — called with one merged object).
6. **Backend position 1 test**: Send `PATCH /lists/:id/reorder` with `{ newPosition: 1 }`; assert
   200 response (will fail on unfixed code — returns 400).

**Expected Counterexamples**:
- Card state becomes inconsistent after two cross-list `onDragOver` events
- `moveCard` receives `newPosition: 0` for empty-list drops
- `onClick` handler is never invoked on a short card tap
- `createCard` and `createList` receive `undefined` as their first argument
- Backend rejects `newPosition: 1` with a 400 VALIDATION_ERROR

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the
expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedCode(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces
the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalCode(input) = fixedCode(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code for non-buggy interactions, then write
property-based tests capturing that behavior.

**Test Cases**:
1. **Same-list reorder preservation**: Verify dragging a card within the same list still calls
   `moveCard` with the correct `newListId` and `newPosition`.
2. **List reorder positions 2+ preservation**: Verify dragging a list to positions 2, 3, 4 still
   calls `reorderList` with the correct `newPosition`.
3. **Card modal preservation**: Verify that after the drag-handle separation, clicking a card
   still opens the modal and `onCardClick` is invoked.
4. **Delete preservation**: Verify card and list deletion still removes items from state and calls
   the correct API.

### Unit Tests

- Test `onDragOver` with two sequential cross-list moves and assert final card placement
- Test `onDragEnd` drop onto empty list container and assert `moveCard` called with `newPosition >= 1`
- Test `AddCard.submit` and assert `createCard(listId, data)` two-arg call
- Test `AddList.submit` and assert `createList(boardId, data)` two-arg call
- Test backend `reorderList` with `newPosition: 1` and assert 200 OK
- Test backend `reorderList` with `newPosition: 0` and assert 400 error

### Property-Based Tests

- Generate random sequences of cross-list drag events and verify card state remains consistent
  (no duplicates, no missing cards) after each event
- Generate random `newPosition` values (1–N) for list reorder and verify backend accepts all
  valid positions and rejects only `0`, `null`, and `undefined`
- Generate random card click events (short taps) and verify `onClick` always fires after the
  drag-handle separation fix

### Integration Tests

- Full drag flow: drag card from list A to list B, release, verify card appears in list B in the
  UI and `moveCard` API call succeeds
- Full add-card flow: open "Add a card" form, submit title, verify card appears in the list and
  the API call succeeds with correct `list_id`
- Full add-list flow: open "Add another list" form, submit title, verify list appears on the board
  and the API call succeeds with correct `board_id`
- Full list reorder to position 1: drag second list to first position, verify UI updates and
  backend accepts the request
