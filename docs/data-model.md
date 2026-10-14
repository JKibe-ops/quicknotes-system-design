# QuickNotes data model

QuickNotes uses PostgreSQL. Users own notes and tags; tags can be attached to many notes, and notes can have many tags through the `note_tags` join table. Cascading deletes keep dependent data from becoming orphaned.

## Entities and schema

- **users**: an account, identified by `id`; owns notes and tags.
- **notes**: a user's note, identified by `id`; `user_id` references its owner.
- **tags**: a user-defined label, identified by `id`; tag names are unique per user.
- **note_tags**: association between one note and one tag; the pair is its composite primary key.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL CHECK (length(btrim(title)) > 0),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL CHECK (length(btrim(name)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tags_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (note_id, tag_id)
);
```

`users` to `notes` and `users` to `tags` are one-to-many relationships. `notes` to `tags` is many-to-many, represented by one row per note/tag pair in `note_tags`. Since tags and notes each carry an owner ID, API writes must verify that an attached tag belongs to the note's owner.

## Indexes

```sql
CREATE INDEX notes_user_created_id_idx
    ON notes (user_id, created_at DESC, id DESC);

CREATE INDEX note_tags_tag_note_idx
    ON note_tags (tag_id, note_id);
```

The notes index supports a user's newest-first, cursor-paginated note list without scanning other users' rows. The reverse association index makes tag-filtered note lookup efficient; the primary key already supports note-to-tag lookups.

## Example queries

List a user's newest notes, continuing after a `(created_at, id)` cursor:

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = $1
  AND (created_at, id) < ($2, $3)
ORDER BY created_at DESC, id DESC
LIMIT $4;
```

Fetch one note and its tag names with a JOIN:

```sql
SELECT n.id, n.title, n.body, t.id AS tag_id, t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt ON nt.note_id = n.id
LEFT JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = $1 AND n.id = $2
ORDER BY t.name;
```

Count each user's notes:

```sql
SELECT user_id, count(*) AS note_count
FROM notes
GROUP BY user_id
ORDER BY note_count DESC;
```

Attach a tag only when it belongs to the same user as the note:

```sql
INSERT INTO note_tags (note_id, tag_id)
SELECT n.id, t.id
FROM notes AS n
JOIN tags AS t ON t.id = $2 AND t.user_id = n.user_id
WHERE n.id = $1
ON CONFLICT (note_id, tag_id) DO NOTHING;
```

## SQL or NoSQL?

SQL is the better fit because users, notes, tags, and their many-to-many links have clear relational constraints, and note creation/tag updates need transactions to keep those relationships consistent. PostgreSQL provides foreign keys, indexing, transactions, and flexible text fields without sacrificing structured queries as the product grows.
