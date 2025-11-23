# Authentication Implementation Walkthrough

I have implemented the unified authentication system using Clerk across your three applications.

## 1. Configuration Required
You must add your Clerk API keys to the environment files before running the apps.

### `tai-auth-service/.env`
Add the following keys:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL="file:./dev.db"
```

### `rie/.env`
Add the following keys:
```env
CLERK_ISSUER_URL=https://<your-clerk-domain>.clerk.accounts.dev
AUTH_SERVICE_URL=http://localhost:3000
```

### `rie/TAI-Compliance-Co-Pilot/.env`
Create this file and add:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## 2. Verification Steps

### Step 1: Start the Auth Service
```bash
cd tai-auth-service
npm run dev
```
- Go to `http://localhost:3000/admin`.
- Sign up/Login with Clerk.
- You should see the Admin Dashboard (initially empty or with your user).

### Step 2: Start the RIE Backend
```bash
cd rie
# Ensure your virtual env is active
uvicorn api.main:app --reload
```
- The API is now protected. Requests to `/api/v1/enforcement` without a token will fail (403/401).

### Step 3: Start Compliance Co-Pilot (React)
```bash
cd rie/TAI-Compliance-Co-Pilot
npm run dev
```
- Go to `http://localhost:5173`.
- You should be redirected to the Clerk Login page.
- After login, you should see the "AI-Powered Compliance Intelligence" search bar.
- Try a search (e.g., "What is AML?"). It should work, confirming the token is passed to the backend.

### Step 4: Start RIE Streamlit App
```bash
cd rie
streamlit run regulatory_search_app.py
```
- Go to `http://localhost:8501`.
- You should see a "Login with TigressAI" button.
- Click it to login via the Auth Service, or paste a valid access token manually.

## 3. Troubleshooting
- **Migration Error**: If you see DB errors in `tai-auth-service`, run `DATABASE_URL="file:./dev.db" npx prisma migrate dev`.
- **CORS**: If the React app fails to call the API, check the CORS settings in `rie/api/main.py`.
