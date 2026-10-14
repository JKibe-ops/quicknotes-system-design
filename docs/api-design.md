# QuickNotes API design

The API is a versioned JSON REST API. Authenticated endpoints use a bearer access token in the `Authorization` header. Timestamps are ISO 8601 UTC strings, IDs are UUIDs, and list results are cursor-paginated.

## Endpoints

| Method | Path | Description | Success |
| --- | --- | --- | --- |
| `POST` | `/v1/auth/signup` | Create a user account. | `201 Created` |
| `POST` | `/v1/auth/login` | Verify credentials and issue an access token. | `200 OK` |
| `GET` | `/v1/users/me` | Return the authenticated user's profile. | `200 OK` |
| `GET` | `/v1/notes` | List the authenticated user's notes; supports `cursor`, `limit` (1–100) and `tag`. | `200 OK` |
| `POST` | `/v1/notes` | Create a note, optionally attaching existing tags. | `201 Created` |
| `GET` | `/v1/notes/{noteId}` | Get one note belonging to the authenticated user. | `200 OK` |
| `PATCH` | `/v1/notes/{noteId}` | Update supplied note fields and/or its tag set. | `200 OK` |
| `DELETE` | `/v1/notes/{noteId}` | Delete a note and its tag associations. | `204 No Content` |
| `GET` | `/v1/tags` | List the authenticated user's tags. | `200 OK` |

All note and tag queries are scoped to the authenticated user. The API returns `404 Not Found` for both nonexistent resources and resources owned by another user to avoid disclosing their existence.

## Create a note

`POST /v1/notes`

Request:

```json
{
  "title": "Plan the launch",
  "body": "Draft the rollout checklist and share it with the team.",
  "tagIds": ["4f023f18-5353-4b3f-a7af-b46a22a26300"]
}
```

Response: `201 Created`

```json
{
  "id": "904ae83f-3d31-4a6f-bf4b-9781e02a21a8",
  "userId": "799f5a57-75b4-40b2-9d1f-2088b09c7b79",
  "title": "Plan the launch",
  "body": "Draft the rollout checklist and share it with the team.",
  "tags": [
    {
      "id": "4f023f18-5353-4b3f-a7af-b46a22a26300",
      "name": "work"
    }
  ],
  "createdAt": "2026-10-14T11:45:00Z",
  "updatedAt": "2026-10-14T11:45:00Z"
}
```

## List notes

`GET /v1/notes?limit=2`

Response: `200 OK`

```json
{
  "items": [
    {
      "id": "904ae83f-3d31-4a6f-bf4b-9781e02a21a8",
      "userId": "799f5a57-75b4-40b2-9d1f-2088b09c7b79",
      "title": "Plan the launch",
      "body": "Draft the rollout checklist and share it with the team.",
      "tags": [{ "id": "4f023f18-5353-4b3f-a7af-b46a22a26300", "name": "work" }],
      "createdAt": "2026-10-14T11:45:00Z",
      "updatedAt": "2026-10-14T11:45:00Z"
    },
    {
      "id": "d32c9912-2adf-40e8-b275-4b83633532f6",
      "userId": "799f5a57-75b4-40b2-9d1f-2088b09c7b79",
      "title": "Read later",
      "body": "Review the API pagination guide.",
      "tags": [],
      "createdAt": "2026-10-13T16:20:00Z",
      "updatedAt": "2026-10-13T16:20:00Z"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTEzVDE2OjIwOjAwWiIsImlkIjoiZDMyYzk5MTItMmFkZi00MGU4LWIyNzUtNGI4MzYzMzUzMmY2In0="
}
```

## Error responses

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Malformed JSON, invalid field values, or invalid pagination parameters. |
| `401 Unauthorized` | Missing, expired, or invalid authentication credentials. |
| `403 Forbidden` | Authenticated user is not permitted to perform the requested action. |
| `404 Not Found` | Resource does not exist or is not visible to this user. |
| `409 Conflict` | A unique value, such as a tag name for this user, already exists. |
| `422 Unprocessable Content` | Valid JSON that fails field validation. |
| `429 Too Many Requests` | Rate limit exceeded. |
| `500 Internal Server Error` | Unexpected server-side failure. |

Example error body (`422`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [{ "field": "title", "message": "Title is required and must be 100 characters or fewer." }],
    "requestId": "req_01J9D4K1Q6A8P2"
  }
}
```
