# TigressAI Auth Service

The **TigressAI Auth Service** is the central authentication and entitlement management system for the TigressAI platform. It integrates with **Clerk** for user authentication and manages product access via a local PostgreSQL database.

## Features
- **Clerk Integration**: Webhook handling for user synchronization (`user.created`, `user.updated`).
- **Entitlement Management**: Admin dashboard to grant/revoke access to products (e.g., RIE).
- **Metadata Sync**: Automatically syncs user entitlements to Clerk's public metadata for client-side access control.
- **Admin Dashboard**: Secure interface for managing user access.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Clerk Account

### Environment Variables
Create a `.env` file with the following:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tai_auth_service"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
```

### Installation
```bash
npm install
npx prisma generate
npx prisma db push
```

### Running Locally
```bash
npm run dev
```
Access the app at [http://localhost:3000](http://localhost:3000).

## Admin Dashboard
Access the admin dashboard at `/admin`.
**Note**: You must be an admin to access this page.
To make the first user an admin, run:
```bash
npm run make-admin -- <user_id>
```

## Deployment
Deploy on Vercel or any Node.js hosting platform. Ensure all environment variables are set in the production environment.

### Production
Currently deployed to Vercel with Postgres database.
