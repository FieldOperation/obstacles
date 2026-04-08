# Obstacles Case Management System

A web-based case management system for reporting and tracking road obstacles and damages, built with React and Supabase.

## Features

- **Two Modules**: Obstacles and Damages reporting
- **Role-Based Access Control**: Admin, Worker, and Others (read-only)
- **Real-time Features**: Photo uploads, geotagging, GPS capture
- **Executive Dashboard**: Interactive filters and analytics
- **Notifications**: Real-time alerts for case creation and resolution
- **Supabase-Powered**: Fully serverless architecture

## Project Structure

```
obstacles/
├── frontend/         # React web application (Supabase-only)
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier available)
- npm or yarn

### Installation

```bash
# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials:
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run database migrations:**
   - Use Supabase SQL Editor
   - See `SUPABASE_CONVERSION_GUIDE.md` for schema and RLS policies

3. **Create Storage Buckets:**
   - `cases` - for case photos
   - `logos` - for contractor/owner logos

4. **Set up Row Level Security (RLS) policies:**
   - Critical for security!
   - See `SUPABASE_CONVERSION_GUIDE.md` for policies

### Running the Application

```bash
# Development
cd frontend
npm run dev

# Production build
npm run build
# Upload dist/ folder to any static hosting (HostGator, Vercel, Netlify, etc.)
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage, Realtime)
- **Real-time**: Supabase Realtime
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

## Roles & Permissions

- **Admin**: Full access to all features, user management, master data
- **Worker**: Create cases, upload photos, close cases
- **Others**: Read-only access, receives notifications

## Deployment

This is a **static site** - just upload the `frontend/dist/` folder to any hosting:

- ✅ HostGator (shared hosting works!)
- ✅ Vercel
- ✅ Netlify
- ✅ GitHub Pages
- ✅ Any static file hosting

No server needed! Everything runs through Supabase.

## Conversion Status

⚠️ **This project is being converted to Supabase-only architecture.**

See `SUPABASE_CONVERSION_GUIDE.md` for:
- What's been completed
- What still needs to be done
- Migration steps
- RLS policy examples

## License

MIT
