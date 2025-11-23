# Unified Authentication Implementation Plan

## Goal Description
Establish a centralized authentication and entitlement infrastructure for **TigressAI** using Clerk.
- **`tai-auth-service`**: The central platform service (Next.js). Hosts Admin Dashboard and manages entitlements.
- **`rie`**: The Regulatory Intelligence Engine.
    - **Streamlit App**: Updated to use Clerk for auth.
    - **FastAPI Backend**: Secured with Clerk JWT validation.
- **`TAI-Compliance-Co-Pilot`**: The React-based Copilot UI. Updated to use Clerk for auth and pass tokens to the backend.

## User Review Required
> [!IMPORTANT]
> **Clerk Keys**: I need the **Clerk Publishable Key**, **Secret Key**, and **Issuer URL**.
> **Redirect URLs**: Add `http://localhost:8501` (RIE Streamlit), `http://localhost:3000` (Auth Service), and `http://localhost:5173` (Vite/Copilot) to Clerk.

## Proposed Changes

### 1. `tai-auth-service` (Central Platform)
Initialize as a **Next.js** application.

#### [NEW] [schema.prisma](file:///Users/vinodpaniker/Documents/GitHub/tai-auth-service/prisma/schema.prisma)
- Define models: `User`, `Product`, `Plan`, `UserProductAccess`.

#### [NEW] [route.ts](file:///Users/vinodpaniker/Documents/GitHub/tai-auth-service/src/app/api/webhooks/clerk/route.ts)
- Webhook handler for `user.created`, `user.updated`.

#### [NEW] [sync-metadata.ts](file:///Users/vinodpaniker/Documents/GitHub/tai-auth-service/src/lib/sync-metadata.ts)
- Update Clerk `public_metadata` with entitlements.

#### [NEW] [page.tsx](file:///Users/vinodpaniker/Documents/GitHub/tai-auth-service/src/app/admin/page.tsx)
- Admin Dashboard to toggle product access.

### 2. `rie` (Streamlit App)
Update `regulatory_search_app.py` to verify Clerk identities.

#### [MODIFY] [auth_config.py](file:///Users/vinodpaniker/Documents/GitHub/rie/auth_config.py)
- Implement `verify_clerk_token(token)` using `python-jose`.

#### [MODIFY] [regulatory_search_app.py](file:///Users/vinodpaniker/Documents/GitHub/rie/regulatory_search_app.py)
- Replace login form with "Login with TigressAI" (redirect to Auth Service).
- Validate token on return.

### 3. `rie` (FastAPI Backend)
Secure the API used by Compliance Co-Pilot.

#### [NEW] [auth_middleware.py](file:///Users/vinodpaniker/Documents/GitHub/rie/api/auth_middleware.py)
- Create a FastAPI dependency `get_current_user` that validates the Bearer token against Clerk's JWKS.

#### [MODIFY] [main.py](file:///Users/vinodpaniker/Documents/GitHub/rie/api/main.py)
- Apply the auth dependency globally or to specific routers.

### 4. `TAI-Compliance-Co-Pilot` (React App)
Secure the Copilot UI.

#### [MODIFY] [package.json](file:///Users/vinodpaniker/Documents/GitHub/rie/TAI-Compliance-Co-Pilot/package.json)
- Add `@clerk/clerk-react`.

#### [MODIFY] [main.tsx](file:///Users/vinodpaniker/Documents/GitHub/rie/TAI-Compliance-Co-Pilot/src/main.tsx)
- Wrap the app in `ClerkProvider`.

#### [MODIFY] [App.tsx](file:///Users/vinodpaniker/Documents/GitHub/rie/TAI-Compliance-Co-Pilot/src/App.tsx)
- Add `SignedOut` (redirect to login) and `SignedIn` (show app) guards.

#### [MODIFY] [client.ts](file:///Users/vinodpaniker/Documents/GitHub/rie/TAI-Compliance-Co-Pilot/src/api/client.ts)
- Add an interceptor to inject the `Authorization: Bearer <token>` header from Clerk.

## Verification Plan

### Automated Tests
- **`tai-auth-service`**: Unit tests for webhook/metadata sync.
- **`rie` API**: Test endpoints with valid/invalid tokens.

### Manual Verification
1. **Admin Setup**: Create "RIE" and "Copilot" products in `tai-auth-service`.
2. **Streamlit Flow**: User logs in via Auth Service -> Access RIE.
3. **Copilot Flow**:
    - User opens Copilot (React).
    - Redirected to Clerk Login.
    - After login, user can search (API request succeeds).
    - Verify API rejects requests without token.
