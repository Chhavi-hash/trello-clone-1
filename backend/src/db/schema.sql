-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS card_members CASCADE;
DROP TABLE IF EXISTS card_labels CASCADE;
DROP TABLE IF EXISTS labels CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS boards CASCADE;

-- Members
CREATE TABLE members (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) >= 1),
  avatar_url VARCHAR(255) NOT NULL,
  email      VARCHAR(100)
);

-- Boards
CREATE TABLE boards (
  id         SERIAL PRIMARY KEY,
  member_id  INTEGER REFERENCES members(id) ON DELETE SET NULL,
  title      VARCHAR(100) NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 100),
  bg_type    VARCHAR(20)  NOT NULL DEFAULT 'color' CHECK (bg_type IN ('color','gradient','image')),
  bg_value   VARCHAR(255) NOT NULL DEFAULT '#0052cc',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists
CREATE TABLE lists (
  id        SERIAL PRIMARY KEY,
  board_id  INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title     VARCHAR(50) NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 50),
  position  INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards
CREATE TABLE cards (
  id          SERIAL PRIMARY KEY,
  list_id     INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title       VARCHAR(100) NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) <= 5000),
  cover_type  VARCHAR(10) CHECK (cover_type IN ('color','gradient','image')),
  cover_value VARCHAR(255),
  archived    BOOLEAN NOT NULL DEFAULT FALSE,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Labels
CREATE TABLE labels (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(30) NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 30),
  color VARCHAR(20) NOT NULL
);

-- Card <-> Labels (join)
CREATE TABLE card_labels (
  card_id  INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Card <-> Members (join)
CREATE TABLE card_members (
  card_id   INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, member_id)
);

-- Checklist items (directly on card, no checklists table)
CREATE TABLE checklist_items (
  id          SERIAL PRIMARY KEY,
  card_id     INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  text        VARCHAR(200) NOT NULL CHECK (char_length(trim(text)) BETWEEN 1 AND 200),
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  position    INTEGER NOT NULL DEFAULT 0
);

-- Attachments
CREATE TABLE attachments (
  id      SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  url     TEXT NOT NULL,
  name    VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id         SERIAL PRIMARY KEY,
  card_id    INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES members(id),
  text       TEXT NOT NULL CHECK (char_length(trim(text)) >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_logs (
  id           SERIAL PRIMARY KEY,
  card_id      INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  action_type  VARCHAR(50) NOT NULL,
  performed_by INTEGER REFERENCES members(id),
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== SEED DATA =====================

-- Members (no duplicates — one Aman Patel with real avatar)
INSERT INTO members (name, avatar_url, email) VALUES
  ('Aman Patel',   'https://avatar.iran.liara.run/public/boy?id=5', 'aman@example.com'),
  ('Priya Verma',  'https://i.pravatar.cc/150?img=32', 'priya@example.com'),
  ('Rahul Mehta',  'https://i.pravatar.cc/150?img=7',  'rahul@example.com'),
  ('Sneha Kapoor', 'https://i.pravatar.cc/150?img=47', 'sneha@example.com'),
  ('Chahal Goyal', 'https://i.pravatar.cc/150?img=5',  'chahal@example.com');

-- Board (one per member, seeded after members)
INSERT INTO boards (member_id, title, bg_type, bg_value) VALUES
  (1, 'Internship Project', 'color', '#0052cc'),
  (2, 'Aman''s Board',      'color', '#0052cc'),
  (3, 'Priya''s Board',     'color', '#0052cc'),
  (4, 'Rahul''s Board',     'color', '#0052cc'),
  (5, 'Sneha''s Board',     'color', '#0052cc');

-- Labels
INSERT INTO labels (name, color) VALUES
  ('bug',         '#eb5a46'),
  ('feature',     '#61bd4f'),
  ('urgent',      '#ff9f1a'),
  ('frontend',    '#0079bf'),
  ('backend',     '#c377e0'),
  ('design',      '#ff78cb');

-- Lists
INSERT INTO lists (board_id, title, position) VALUES
  (1, 'Todo',        1),
  (1, 'In Progress', 2),
  (1, 'Testing',     3),
  (1, 'Done',        4),
  (1, 'Backlog',     5);

-- Cards
INSERT INTO cards (list_id, title, description, position) VALUES
  (1, 'Setup project repository',   '## Setup\nInitialize the GitHub repo, add `.gitignore`, and configure CI/CD with GitHub Actions.', 1),
  (1, 'Implement drag & drop UI',   '## Drag & Drop\nUse **@dnd-kit** to implement sortable lists and cards.\n\n- Horizontal list reorder\n- Cross-list card moves\n- Optimistic UI updates', 2),
  (2, 'Design database schema',     '## Schema\nDesign normalized tables for boards, lists, cards, labels, members.\n\n```sql\nCREATE TABLE cards (...);\n```', 1),
  (2, 'Fix login bug',              '## Bug\nUsers are getting 401 on valid sessions. Check JWT expiry logic.', 2),
  (3, 'Frontend layout adjustments','## Layout\nFix responsive issues on mobile. Adjust card widths and list scroll behavior.', 1),
  (4, 'Create README',              '## README\nDocument setup instructions, API endpoints, and contribution guidelines.', 1),
  (5, 'Write unit tests',           '## Tests\nCover all API endpoints with Jest + Supertest. Aim for 80% coverage.', 1),
  (5, 'Add dark mode',              '## Dark Mode\nImplement CSS variable-based theming. Toggle via header button.', 2),
  (1, 'Setup CI/CD pipeline',       '## CI/CD\nConfigure GitHub Actions to run tests and deploy on merge to main.', 3),
  (2, 'Build REST API',             '## API\nImplement all endpoints per the API contract in the HLD.', 3);

-- Card Labels
INSERT INTO card_labels (card_id, label_id) VALUES
  (1, 2), -- Setup repo → feature
  (2, 2), (2, 3), -- DnD → feature, urgent
  (3, 5), -- DB schema → backend
  (4, 1), (4, 3), -- Fix bug → bug, urgent
  (5, 4), -- Layout → frontend
  (6, 2), -- README → feature
  (7, 5), -- Unit tests → backend
  (8, 4), -- Dark mode → frontend
  (9, 2), (9, 3), -- CI/CD → feature, urgent
  (10, 5); -- Build API → backend

-- Card Members
INSERT INTO card_members (card_id, member_id) VALUES
  (1, 2), -- Setup repo → Aman
  (2, 3), -- DnD → Priya
  (3, 1), (3, 4), -- DB schema → Chahal, Rahul
  (4, 3), (4, 2), -- Fix bug → Priya, Aman
  (5, 1), -- Layout → Chahal
  (9, 4), -- CI/CD → Rahul
  (10, 1), (10, 2); -- Build API → Chahal, Aman

-- Checklist items for card 1 (Setup project repository)
INSERT INTO checklist_items (card_id, text, is_complete, position) VALUES
  (1, 'Create GitHub repo',                    TRUE,  1),
  (1, 'Add .gitignore and README',             TRUE,  2),
  (1, 'Initialize README with description',    FALSE, 3),
  (1, 'Configure branch protection rules',     FALSE, 4);

-- Checklist items for card 2 (Implement drag & drop)
INSERT INTO checklist_items (card_id, text, is_complete, position) VALUES
  (2, 'Install @dnd-kit packages',             TRUE,  1),
  (2, 'Implement list horizontal sort',        TRUE,  2),
  (2, 'Implement card vertical sort',          FALSE, 3),
  (2, 'Handle cross-list card moves',          FALSE, 4);

-- Checklist items for card 3 (Design DB schema)
INSERT INTO checklist_items (card_id, text, is_complete, position) VALUES
  (3, 'Define boards table',                   TRUE,  1),
  (3, 'Define lists and cards tables',         TRUE,  2),
  (3, 'Add join tables for labels/members',    TRUE,  3),
  (3, 'Write seed data script',                FALSE, 4);

-- Attachments
INSERT INTO attachments (card_id, url, name) VALUES
  (1, 'https://github.com/myorg/internship-board', 'GitHub Repository'),
  (3, 'https://dbdiagram.io/d/sample',              'DB Diagram'),
  (10, 'https://www.postman.com/collections/sample', 'Postman Collection');

-- Comments
INSERT INTO comments (card_id, author_id, text, created_at) VALUES
  (1, 1, 'Let''s use GitHub Actions for CI/CD. I''ll set up the workflow file.', '2026-03-27 10:15:00'),
  (1, 3, 'Agreed! I''ll add the test runner step.', '2026-03-27 11:00:00'),
  (3, 4, 'Should we use Sequelize or raw queries?', '2026-03-27 12:30:00'),
  (3, 1, 'Let''s go with raw queries for now, keep it simple.', '2026-03-27 13:00:00'),
  (4, 2, 'Reproduced the bug. It''s the refresh token not being rotated.', '2026-03-27 14:00:00'),
  (4, 3, 'I''ll push a fix today.', '2026-03-27 14:30:00');

-- Activity Logs
INSERT INTO activity_logs (card_id, action_type, performed_by, details, created_at) VALUES
  (1, 'CREATE_CARD',            2, '{"title":"Setup project repository"}',                          '2026-03-26 09:00:00'),
  (1, 'ADD_MEMBER',             2, '{"member":"Aman Patel"}',                                      '2026-03-26 09:05:00'),
  (1, 'ADD_LABEL',              2, '{"label":"feature"}',                                           '2026-03-26 09:06:00'),
  (3, 'CREATE_CARD',            1, '{"title":"Design database schema"}',                            '2026-03-26 10:00:00'),
  (3, 'MOVE_CARD',              1, '{"from":"Todo","to":"In Progress"}',                            '2026-03-27 09:00:00'),
  (4, 'CREATE_CARD',            3, '{"title":"Fix login bug"}',                                     '2026-03-27 08:00:00'),
  (4, 'ADD_LABEL',              3, '{"label":"bug"}',                                               '2026-03-27 08:01:00'),
  (4, 'ADD_LABEL',              3, '{"label":"urgent"}',                                            '2026-03-27 08:02:00'),
  (4, 'ADD_COMMENT',            2, '{"text":"Reproduced the bug..."}',                              '2026-03-27 14:00:00'),
  (2, 'CREATE_CARD',            3, '{"title":"Implement drag & drop UI"}',                          '2026-03-26 11:00:00'),
  (2, 'COMPLETE_CHECKLIST_ITEM',3, '{"item":"Install @dnd-kit packages"}',                         '2026-03-27 10:00:00');
