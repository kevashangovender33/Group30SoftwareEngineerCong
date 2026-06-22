# Product Context

## Overview

Node Conf Starter — a full-stack starter template for building web applications with a React frontend and Express backend.

## Purpose

Provides a ready-to-go development environment for building modern web apps with best-in-class tooling, testing, and database support out of the box.

## Key Features

- Health-check endpoint for monitoring
- Echo and info API endpoints as examples
- Counter UI demonstrating React state and backend connectivity
- SQLite database with Prisma ORM for zero-config persistence
- Full testing pipeline (unit, integration, e2e)

## Key Commands

- `npm run dev` — Start both server and client in development mode
- `npm run build` — Build both packages
- `npm run test` — Run all unit tests
- `npm run test:e2e` — Run Playwright e2e tests
- `npm run lint` — Lint all files
- `npm run format` — Format all files with Prettier
- `npm run db:migrate --workspace=server` — Run Prisma migrations
- `npm run db:generate --workspace=server` — Generate Prisma client
