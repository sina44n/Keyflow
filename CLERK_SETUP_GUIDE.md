# KEYFLOW — Clerk Authentication, Google OAuth & Production Deployment Guide

This guide documents the end-to-end configuration required to pair your Clerk identity provider with the KEYFLOW React frontend and Django REST Framework backend.

---

## 1. Creating Your Clerk Application

1. Navigate to the [Clerk Dashboard](https://dashboard.clerk.com/) and click **Add application**.
2. **Application Name**: Enter `KEYFLOW` (or `KEYFLOW Dev` for your test environment).
3. **Authentication Options**:
   - Check **Email address** (Password & Email verification code).
   - Check **Google** (Social login).
4. Click **Create application**.

---

## 2. Development vs. Production Environments

Clerk provides separate environments:
- **Development**: Keys start with `pk_test_` and `sk_test_`. Account domain is on `clerk.accounts.dev`. Test emails and SMS can be used.
- **Production**: Keys start with `pk_live_` and `sk_live_`. Requires a verified custom domain (e.g., `auth.keyflow.app` or `keyflow.app`).
- **Never mix environments**: A frontend using `pk_live_` will issue tokens rejected by a backend configured with `pk_test_`.

---

## 3. API Keys & Backend Verification Configuration

In your Clerk Dashboard, go to **Configure** → **Developers** → **API Keys**:

### Frontend
- Copy the **Publishable key** (`pk_test_...` or `pk_live_...`).
- In `frontend/.env` (or Vercel Environment Variables):
  ```bash
  VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
  ```

### Backend
- Copy the **Secret key** (`sk_test_...` or `sk_live_...`).
- Copy the **Frontend API URL** / **Issuer URL** (e.g., `https://your-app-12.clerk.accounts.dev`).
- In `backend/.env` (or Railway/Render Environment Variables):
  ```bash
  CLERK_SECRET_KEY=sk_test_...
  CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_ISSUER=https://your-app-12.clerk.accounts.dev
  CLERK_JWKS_URL=https://your-app-12.clerk.accounts.dev/.well-known/jwks.json
  ```
- *Optional (High performance/offline verification)*:
  In Clerk Dashboard → **API Keys** → **Advanced** → **Show JWT Public Key**:
  Copy the PEM public key and set:
  ```bash
  CLERK_PEM_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  ```

---

## 4. Google Social Connection (OAuth 2.0)

Clerk provides a shared development credential for Google OAuth out of the box, but **production requires custom Google Cloud credentials**:

### In Google Cloud Console:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create or select your project.
3. Configure **OAuth consent screen**:
   - User Type: External.
   - App name: `KEYFLOW`.
   - Support email & developer contact email.
   - Authorized domains: `clerk.accounts.dev` (in dev) and your custom domain (e.g. `keyflow.app`).
4. Create **OAuth 2.0 Client ID**:
   - Application type: **Web application**.
   - Name: `KEYFLOW Clerk Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (local dev)
     - `https://your-frontend.vercel.app`
     - `https://your-app-12.clerk.accounts.dev` (or production Clerk domain)
   - **Authorized redirect URIs**:
     - Copy the Redirect URI provided by Clerk: `https://your-app-12.clerk.accounts.dev/v1/oauth_callback` (or your Clerk custom domain callback).
5. Copy the generated **Client ID** and **Client Secret**.

### In Clerk Dashboard:
1. Go to **User & Authentication** → **Social Connections** → **Google**.
2. Toggle on **Use custom credentials**.
3. Paste the **Client ID** and **Client Secret** obtained from Google Cloud.
4. Save changes.

---

## 5. Redirect and Callback URLs

In Clerk Dashboard → **Paths**:
- Sign-in path: `/login`
- Sign-up path: `/register`
- After sign-in redirect URL: `/workstation` (or `/academy`)
- After sign-up redirect URL: `/workstation` (or `/academy`)

In your production deployment:
- Ensure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in `backend/.env` list the exact frontend origin(s):
  ```bash
  CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
  CSRF_TRUSTED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
  ```

---

## 6. Email Verification & Password Recovery

### Email Verification
1. In Clerk Dashboard → **User & Authentication** → **Email, Phone, Username**:
   - Ensure **Email address** is set to **Required**.
   - Verification strategy: **Email verification code** or **Email verification link**.
   - Password: **Required** (minimum 8 characters).

### Password Recovery
- Clerk manages password recovery natively. When a user clicks "Forgot password" on the `/login` screen or navigates to `/forgot-password`, Clerk sends a secure verification code/link to the user's email.
- **Custom Email Provider**:
  In development, Clerk sends emails via its standard dev delivery pool.
  In production, go to **Configure** → **Email** to connect your domain with SPF/DKIM or provide an external SMTP/SendGrid/Resend key for branded emails.

---

## 7. Django REST Framework Identity Mapping Architecture

### Identity Resolution Flow
1. **Frontend**: When the user signs in via Clerk (`<SignIn />`, `<SignUp />`, or Google OAuth), Clerk issues an RS256 JWT session token.
2. **Axios Client**: The request interceptor retrieves the current Clerk session token via `session.getToken()` and attaches:
   ```http
   Authorization: Bearer <clerk_jwt>
   ```
3. **DRF Authentication (`accounts.authentication.ClerkAuthentication`)**:
   - Validates token signature against Clerk's JWKS or static PEM public key.
   - Validates `iss` (Clerk Issuer), `exp` (Expiry), and non-empty `sub` (Clerk User ID).
   - Looks up Django `User` where `clerk_id == sub`.
   - **Existing Account Linking**: If no `clerk_id` match is found, looks up existing Django user by verified `email`. If found, securely sets `user.clerk_id = sub` without altering primary keys (`user.id`).
   - **New User Provisioning**: If no user exists, creates a new Django `User`, initializes `UserProfile` and `UserPreferences`, sets `clerk_id = sub`, and sets an unusable password.
   - Resolves to `request.user` seamlessly.
4. **Data Isolation**: All foreign keys across Academy, Practice, Arcade, and Competitions reference `user.id`. Because integer primary keys are preserved, all user data remains 100% intact.

---

## 8. Automated Testing vs. Live Verification

### Automated Backend Tests
Run the deterministic JWT verification test suite:
```bash
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_clerk_auth.py
```
This tests:
- Cryptographic signature validation with RSA test keys.
- Expired token rejection.
- Invalid issuer rejection.
- Existing Django user linking by verified email.
- Idempotent new user provisioning.
- Tamper-proof competition submission checks.

### Automated Frontend Tests
```bash
cd frontend
npm test
```
This tests:
- Route protections (`/workstation`, `/practice`, `/academy`, `/arcade`).
- ClerkProvider initialization.
- Dynamic Bearer token attachment on API calls.
- Theme and sound preference isolation.

### Manual Live Verification Checklist (Once Real Keys Are Set)
Once real keys are configured in your local `.env`:
1. Start frontend and backend:
   ```bash
   # Terminal 1: Backend
   cd backend
   .\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```
2. Navigate to `http://localhost:5173/register`:
   - Create an account with a real email.
   - Enter verification code.
   - Confirm automatic redirect to `/workstation`.
3. Check Django Admin or database:
   - Verify `User` record exists with `clerk_id = "user_..."`.
   - Verify `UserProfile` and `UserPreferences` are initialized.
4. Complete an Academy lesson or Practice session:
   - Verify record is saved in SQLite / PostgreSQL with the user's `id`.
5. Sign out:
   - Confirm protected routes redirect to `/login`.
6. Sign in again with Google:
   - Confirm OAuth consent modal appears and redirects back cleanly.
