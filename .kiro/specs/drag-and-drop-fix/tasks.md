# Implementation Plan

- [ ] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - All Six Defects Surface on Unfixed Code
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - Test 1 (Bug 1 — stale closure): Simulate two sequential cross-list onDragOver events (A to B, then B to C); assert card ends up in list C with no duplicates. Expect FAILURE on unfixed code.
  - Test 2 (Bug 2 — wrong drop index): Simulate onDragEnd with over being an empty list container; assert moveCard is called with newPosition >= 1. Expect FAILURE (newPosition: 0).
  - Test 3 (Bug 3 — drag listener blocks click): Render SortableCard and simulate a short pointer tap; assert onClick fires. Expect FAILURE on unfixed code.
  - Test 4 (Bug 4 — AddCard wrong signature): Render AddCard, submit a title, assert createCard is called as createCard(listId, { title }) with two args. Expect FAILURE (listId is undefined).
  - Test 5 (Bug 5 — AddList wrong signature): Render AddList, submit a title, assert createList is called as createList(boardId, { title }) with two args. Expect FAILURE (boardId is undefined).
  - Test 6 (Bug 6 — backend rejects position 1): Send PATCH /lists/:id/reorder with { newPosition: 1 }; assert 200 response. Expect FAILURE (returns 400).
  - Document all counterexamples found to understand root causes
  - Mark task complete when all six tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Buggy Interactions Are Unchanged
  - **IMPORTANT**: Follow observation-first methodology — run unfixed code first, observe outputs, then write tests
  - Observe on UNFIXED code for inputs where isBugCondition returns false:
    - Same-list card drag calls moveCard with correct newListId and newPosition
    - List drag to positions 2+ calls reorderList with correct newPosition
    - Card deletion removes the card from state and calls deleteCard
    - Board load populates lists and cards state correctly
  - Write property-based tests capturing these observed behaviors:
    - For all same-list reorder events: moveCard receives the same newListId and a valid newPosition >= 1
    - For all list reorder events with newPosition >= 2: reorderList receives the correct position
    - For all card delete events: item is removed from state and deleteCard is called with the correct id
  - Verify all preservation tests PASS on UNFIXED code before proceeding
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix all six drag-and-drop defects

  - [ ] 3.1 Fix stale closure in onDragOver (Bug 1) — frontend/src/pages/Board.jsx
    - Add cardsRef = useRef({}) and keep it in sync via useEffect(() => { cardsRef.current = cards; }, [cards])
    - In onDragOver, replace findListOfCard(active.id) with a lookup against cardsRef.current so the latest snapshot is always used
    - Also update onDragEnd's findListOfCard calls to read from cardsRef.current for consistency
    - _Bug_Condition: input.type = 'dragOver' AND input.crossList = TRUE AND stateSnapshotUsed = STALE_
    - _Expected_Behavior: card tracks correctly across all onDragOver events with no duplication or disappearance_
    - _Preservation: same-list reorder and list reorder behavior must remain unchanged_
    - _Requirements: 2.1, 3.1, 3.2_

  - [ ] 3.2 Fix wrong drop index for empty/container target (Bug 2) — frontend/src/pages/Board.jsx
    - In onDragEnd, change the newIdx calculation for over.data.current?.type === 'list' from listCards.length - 1 to listCards.length
    - This ensures a card dropped onto an empty list lands at position 1 and onto a non-empty list appends correctly
    - _Bug_Condition: input.type = 'dragEnd' AND input.overType = 'list' AND emptyOrContainerDrop = TRUE_
    - _Expected_Behavior: moveCard called with newPosition = listCards.length + 1_
    - _Requirements: 2.2, 3.1_

  - [ ] 3.3 Separate drag handle from click target (Bug 3) — frontend/src/pages/Board.jsx
    - In SortableCard, move {...listeners} off the outer card div onto a dedicated inner drag-handle element
    - Keep {...attributes} on the outer div for accessibility; keep onClick on the outer div
    - _Bug_Condition: input.type = 'click' AND input.target = 'card' AND dragListenersOnSameElement = TRUE_
    - _Expected_Behavior: onClick fires reliably on card body; drag still works via the handle element_
    - _Requirements: 2.3, 3.3_

  - [ ] 3.4 Fix AddCard wrong API call signature (Bug 4) — frontend/src/components/AddCard.jsx
    - In submit, replace createCard({ list_id: listId, title, position: Date.now() }) with createCard(listId, { title, performed_by: undefined })
    - Note: Board.jsx's inline submitCard inside SortableList already calls createCard correctly — only AddCard.jsx needs fixing
    - _Bug_Condition: input.type = 'addCard' AND callSignature = MERGED_OBJECT_
    - _Expected_Behavior: createCard(listId, { title }) — listId is a valid UUID, not undefined_
    - _Requirements: 2.4_

  - [ ] 3.5 Fix AddList wrong API call signature (Bug 5) — frontend/src/components/AddList.jsx
    - In submit, replace createList({ board_id: boardId, title, position: Date.now() }) with createList(boardId, { title })
    - Note: Board.jsx's inline AddListForm already calls createList correctly — only AddList.jsx needs fixing
    - _Bug_Condition: input.type = 'addList' AND callSignature = MERGED_OBJECT_
    - _Expected_Behavior: createList(boardId, { title }) — boardId is a valid UUID, not undefined_
    - _Requirements: 2.5_

  - [ ] 3.6 Fix falsy position guard in backend (Bug 6) — backend/src/controllers/listController.js
    - In reorderList, replace if (!newPosition) with if (newPosition == null || newPosition < 1)
    - This correctly rejects null, undefined, and 0 while accepting all valid positive integers including 1
    - _Bug_Condition: input.type = 'reorderList' AND input.newPosition = 1 AND backendGuard = FALSY_CHECK_
    - _Expected_Behavior: backend accepts newPosition = 1 and returns 200_
    - _Requirements: 2.6_

  - [ ] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - All Six Defects Resolved
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - Run all six exploration tests from step 1 against the fixed code
    - **EXPECTED OUTCOME**: All six tests PASS (confirms all bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Buggy Interactions Are Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2 against the fixed code
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite and confirm all exploration and preservation tests pass
  - Ask the user if any questions arise about edge cases or unexpected failures
