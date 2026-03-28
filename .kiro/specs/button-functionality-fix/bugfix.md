# Bugfix Requirements Document

## Introduction

Across the Trello-like kanban board application, numerous buttons and interactive elements are rendered in the UI but have no click handlers or produce no observable effect when clicked. This affects the Navbar, Sidebar, BottomNav, Board header, Home page board tiles, and the list context menu. Users clicking these controls receive no feedback and no action is taken, making large portions of the UI appear broken or incomplete.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user clicks the "Workspaces ▾", "Recent ▾", or "Starred ▾" dropdown triggers in the Navbar THEN the system does nothing (no dropdown opens, no navigation occurs)

1.2 WHEN the user clicks the "Create" button in the Navbar THEN the system does nothing (no modal or form appears)

1.3 WHEN the user clicks the 🔔 (Notifications), ❔ (Help), or ⚡ (What's new) icon buttons in the Navbar THEN the system does nothing

1.4 WHEN the user types in the Navbar search input THEN the system does not filter or navigate to any results

1.5 WHEN the user clicks the "Planner", "Inbox", or "Reports" items in the Sidebar THEN the system navigates to `#` (a dead link that does not change the view)

1.6 WHEN the user clicks the "Members" or "Settings" workspace buttons in the Sidebar THEN the system only updates a local `activeTab` state with no visible panel or content rendered for those tabs

1.7 WHEN the user clicks the × close button on the promo box in the Sidebar footer THEN the system does nothing (the promo box remains visible)

1.8 WHEN the user clicks the "▦ Board" view button or the "▾" chevron button in the Board page header THEN the system does nothing

1.9 WHEN the user clicks any of the four buttons (Inbox, Planner, Board, Switch boards) in the BottomNav THEN the system does nothing (no active state change, no navigation)

1.10 WHEN the user clicks the ☆ star button on a board tile on the Home page THEN the system does nothing (the star state is not toggled and is not persisted)

1.11 WHEN the user clicks "↕ Sort by name" in the list context menu on the Board page THEN the system computes a sorted array locally but does not update the displayed card order in state

### Expected Behavior (Correct)

2.1 WHEN the user clicks the "Workspaces ▾", "Recent ▾", or "Starred ▾" triggers in the Navbar THEN the system SHALL open a relevant dropdown or popover (or navigate to the appropriate section)

2.2 WHEN the user clicks the "Create" button in the Navbar THEN the system SHALL open the Create Board modal (same as the "Create new board" tile on the Home page)

2.3 WHEN the user clicks the 🔔, ❔, or ⚡ icon buttons in the Navbar THEN the system SHALL display a relevant panel, tooltip, or placeholder popover indicating the feature (notifications, help, changelog)

2.4 WHEN the user types in the Navbar search input THEN the system SHALL filter visible boards or cards, or navigate to a search results view

2.5 WHEN the user clicks "Planner", "Inbox", or "Reports" in the Sidebar THEN the system SHALL navigate to the corresponding route or display a "coming soon" placeholder so the link is not a dead `#` anchor

2.6 WHEN the user clicks "Members" or "Settings" in the Sidebar workspace section THEN the system SHALL render a visible panel or section corresponding to the selected tab

2.7 WHEN the user clicks the × close button on the Sidebar promo box THEN the system SHALL hide the promo box

2.8 WHEN the user clicks the "▦ Board" or "▾" buttons in the Board header THEN the system SHALL either toggle a view mode or open a view-selection dropdown

2.9 WHEN the user clicks a button in the BottomNav THEN the system SHALL update the active state of that button and navigate or scroll to the corresponding section

2.10 WHEN the user clicks the ☆ star button on a board tile THEN the system SHALL toggle the starred state visually (☆ ↔ ★) and persist it (via localStorage or API)

2.11 WHEN the user clicks "↕ Sort by name" in the list context menu THEN the system SHALL update the displayed card order in state so cards are visibly sorted alphabetically within that list

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user clicks the Kiro/Trello logo in the Navbar THEN the system SHALL CONTINUE TO navigate to the Home page

3.2 WHEN the user clicks the current-member avatar button in the Navbar THEN the system SHALL CONTINUE TO open the member-switcher dropdown

3.3 WHEN the user clicks a member in the member-switcher dropdown THEN the system SHALL CONTINUE TO switch the active member and close the dropdown

3.4 WHEN the user clicks the "Home" item in the Sidebar THEN the system SHALL CONTINUE TO navigate to the `/` route

3.5 WHEN the user clicks the "Boards" workspace button in the Sidebar THEN the system SHALL CONTINUE TO show the boards tab as active

3.6 WHEN the user clicks a board tile on the Home page THEN the system SHALL CONTINUE TO navigate to that board's page

3.7 WHEN the user clicks "Create new board" tile on the Home page THEN the system SHALL CONTINUE TO open the Create Board modal

3.8 WHEN the user clicks the ✕ close button on the Create Board modal THEN the system SHALL CONTINUE TO close the modal without creating a board

3.9 WHEN the user submits the Create Board form with a valid title THEN the system SHALL CONTINUE TO create the board and navigate to it

3.10 WHEN the user clicks the "🎨 Background" or "···" menu buttons in the Board header THEN the system SHALL CONTINUE TO open the background/menu panel

3.11 WHEN the user clicks "✏️ Rename list" or "🗑 Delete list" in the list context menu THEN the system SHALL CONTINUE TO rename or delete the list respectively

3.12 WHEN the user clicks "+ Add a card" within a list THEN the system SHALL CONTINUE TO open the inline card creation form

3.13 WHEN the user clicks "+ Add another list" THEN the system SHALL CONTINUE TO open the inline list creation form

3.14 WHEN the user opens a card modal and interacts with labels, members, checklist, dates, cover, or attachments THEN the system SHALL CONTINUE TO function as currently implemented
