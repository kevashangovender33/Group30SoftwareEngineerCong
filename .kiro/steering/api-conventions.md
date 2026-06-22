---
inclusion: fileMatch
fileMatchPattern: "server/src/routes/**"
---

# API Conventions

These conventions apply when working on Express route handlers.

## Route Structure

- Each domain/resource gets its own Router file in `server/src/routes/`.
- Routers are mounted under `/api` in the main server entry point.
- Use RESTful patterns: `GET /api/resources`, `POST /api/resources`, `GET /api/resources/:id`, etc.

## Request/Response Patterns

- Always return JSON responses.
- Use appropriate HTTP status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Server Error).
- Wrap async route handlers to catch errors and pass them to the error middleware.
- Validate request bodies before processing.

## Error Handling

- Let errors bubble up to the centralized `errorHandler` middleware.
- Throw or pass errors with meaningful messages and appropriate status codes.
- Never expose stack traces or internal details in production responses.

## Example Route Pattern

```typescript
import { Router } from 'express';

export const exampleRouter = Router();

exampleRouter.get('/', async (_req, res, next) => {
  try {
    // business logic
    res.json({ data: [] });
  } catch (error) {
    next(error);
  }
});
```
