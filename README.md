# QuickNotes System Design

A small browser client for trying GET, POST, and DELETE requests against JSONPlaceholder, accompanied by a REST API design, relational data model, and scalable service architecture for a production QuickNotes application.

## Run the API client

The client uses plain HTML, CSS, and JavaScript; it has no build step or package dependencies. From the project directory, start a local static server:

```bash
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000), then use **Load notes**, create a note, or delete a note. The demo calls `https://jsonplaceholder.typicode.com/posts`. That public demo API simulates writes and does not persist them; reload the page to see its original example data.

## System design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- A shared request helper can centralize HTTP error handling, while each user action still needs clear loading, success, empty, and failure states.
- Relational constraints and transactions help enforce ownership and consistency across notes, tags, and their many-to-many associations.
- Capacity estimates are only useful when their traffic assumptions are explicit and peak loads are considered.
- Caches and read replicas improve read performance, but both introduce freshness trade-offs that need deliberate handling.
