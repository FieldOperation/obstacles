# Obstacles Case Management System

A cross-platform case management system for reporting and tracking road obstacles and damages.

## Features

- **Two Modules**: Obstacles and Damages reporting
- **Role-Based Access Control**: Admin, Worker, and Others (read-only)
- **Real-time Features**: Photo uploads, geotagging, GPS capture
- **Executive Dashboard**: Interactive filters and analytics
- **Mobile Support**: React Native app with offline capabilities
- **Notifications**: Real-time alerts for case creation and resolution

## Project Structure

```
obstacles/
├── backend/          # Express API server
├── frontend/         # React web application
├── mobile/           # React Native mobile app
└── shared/           # Shared types and utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install:all

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Run database migrations
cd backend
npx prisma migrate dev
npx prisma generate

# Seed initial data (optional)
npx prisma db seed
```

### Running the Application

```bash
# Backend API (port 3001)
npm run dev:backend

# Frontend Web App (port 3000)
npm run dev:frontend

# Mobile App
npm run dev:mobile
```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Mobile**: React Native, TypeScript
- **Real-time**: Socket.io
- **Authentication**: JWT

## Roles & Permissions

- **Admin**: Full access to all features, user management, master data
- **Worker**: Create cases, upload photos, close cases
- **Others**: Read-only access, receives notifications

## License

MIT
