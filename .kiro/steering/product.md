# Product Context

## Overview

Payment Dispute Triage System — a lightweight internal prototype that helps banking operations users triage and route customer payment disputes more effectively.

## Problem

Frontline bank staff manually gather information from multiple sources, interpret issues, and decide next actions for payment disputes. This is slow, inconsistent, and frustrating. This system automates the triage decision using transparent business rules.

## Core Question

Given this payment dispute, what is the most appropriate next step right now?

## User

Internal banking operations staff responsible for handling customer payment disputes.

## Key Features

- Select customer and transaction from mock dataset
- Capture a dispute with payment type and issue category
- Automatic rules-based triage producing a single recommended action
- Transparent display of which rules fired and why
- Priority (High/Medium/Low) and age (New/Aging/Overdue) indicators
- Single-screen result view with all decision factors visible

## Constraints

- Mock data only — no external banking integrations (REQ-001)
- Static rules-based decision — no AI/ML (REQ-006)
- Three payment types only: Card, EFT, Internal Transfer (REQ-002)
- Single focused journey: capture → triage → result → repeat (REQ-020)

## Key Commands

- `npm run dev` — Start both server and client in development mode
- `npm run build` — Build both packages
- `npm run test` — Run all unit tests
- `npm run test:e2e` — Run Playwright e2e tests
- `npm run lint` — Lint all files
- `npm run format` — Format all files with Prettier
- `npm run db:migrate --workspace=server` — Run Prisma migrations
- `npm run db:seed --workspace=server` — Seed mock data
- `npm run db:generate --workspace=server` — Generate Prisma client
