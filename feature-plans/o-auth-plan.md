# OAuth Authentication Feature Plan

## Overview

Add OAuth (social login) as an alternative to email/password authentication. Users can sign in with Google, GitHub, or Discord. OAuth is handled entirely by Supabase Auth — no additional packages or services needed.

| Provider | Supabase Built-in | Notes |
|----------|-------------------|-------|
| Google | ✅ | Most common, recommended as primary |
| GitHub | ✅ | Good for devs/internal users |
| Discord | ✅ | Backup option |
| More… | ✅ | Facebook, Apple, Twitter, etc. |

---

## Compatibility Assessment ✅

| Requirement | Current Project Status |
|------------|----------------------|
| **Supabase Auth** | Already integrated — `supabase.auth.signInWithPassword()`, `getSession()`, `getUser()` used in `apiAuth.js` ✅ |
| **Session handling** | `useUser.js` + `ProtectedRoute.jsx` already react to auth state changes ✅ |
| **User API** | Same user object returned — `user.id`, `user.email`, `user.user_metadata` — OAuth works identically ✅ |
| **OAuth SDK** | Built into `@supabase/supabase-js` — `supabase.auth.signInWithOAuth()` — no install needed ✅ |
| **Netlify deploy** | `netlify.toml` exists — can add redirect rules if needed ✅ |
| **UI components** | `Button`, `Logo`, `FormRowVertical` available ✅ |

**Verdict:** Fully compatible. Zero new dependencies. OAuth plugs directly into the existing Supabase Auth layer.

---

## Architecture

```
[User clicks "Sign in with Google"]
            ↓
  supabase.auth.signInWithOAuth({ provider: 'google' })
            ↓
  [Supabase redirects to Google OAuth consent screen]
            ↓
  [User authorizes app]
            ↓
  [Google redirects back to: {origin}/auth/callback]
            ↓
  [Supabase automatically handles the code exchange]
            ↓
  [Session is set — cookies/localStorage]
            ↓
  [App detects session via getSession() / onAuthStateChange()]
            ↓
  [Existing useUser.js picks it up → ProtectedRoute renders app]
```

Key insight: The entire OAuth flow is **stateless from the frontend's perspective**. Supabase handles token exchange, session creation, and redirect. The React app just needs to:
1. Initiate the flow (click button)
2. Handle the callback (catch the redirect, tell Supabase to finalize)
3. Let existing auth hooks detect the new session

---

## Implementation Steps

### Step 1 — Supabase Dashboard: Enable OAuth Providers

**No code** — done in Supabase project settings.

1. Go to [Supabase Dashboard](https://supabase.com) → Authentication → Providers
2. Enable **Google**:
   - Get Client ID + Client Secret from [Google Cloud Console](https://console.cloud.google.com) (OAuth 2.0 Web Application)
   - Authorized redirect URI: `https://[YOUR_PROJECT].supabase.co/auth/v1/callback`
   - Save
3. (Optional) Enable **GitHub**, **Discord** with their respective credentials
4. In **URL Configuration** → Site URL: set to `https://the-wild-oasis.netlify.app` (or localhost for dev: `http://localhost:5173`)
5. Add Redirect URLs:
   - `http://localhost:5173/auth/callback` (dev)
   - `https://the-wild-oasis.netlify.app/auth/callback` (prod)

---

### Step 2 — Add OAuth Function in `apiAuth.js`

**File:** `src/services/apiAuth.js` — new function at the bottom:

```js
export async function loginWithOAuth(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider, // 'google' | 'github' | 'discord'
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw new Error(error.message);
  return data;
}
```

That's the entire service layer. `signInWithOAuth` redirects the browser to the provider's OAuth consent page.

---

### Step 3 — Create Auth Callback Page

When the OAuth provider redirects back, the app needs to catch that redirect and tell Supabase to finalize authentication. This page:

- Reads the session from the URL hash/fragment (Supabase injects tokens here)
- Calls `supabase.auth.getSession()` to confirm
- Redirects to `/dashboard`

**File:** `src/pages/AuthCallback.jsx`

```jsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import supabase from "../services/supabase";
import Spinner from "../ui/Spinner";
import styled from "styled-components";

const FullPage = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-grey-50);
`;

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically handles the code exchange on page load.
    // We just need to check that a session was established.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <FullPage>
      <Spinner />
    </FullPage>
  );
}

export default AuthCallback;
```

---

### Step 4 — Add Route for `/auth/callback`

**File:** `src/App.jsx` — add import and route.

Import:
```js
import AuthCallback from "./pages/AuthCallback.jsx";
```

Add inside `<Routes>`:
```jsx
<Route path="auth/callback" element={<AuthCallback />} />
```

This must be outside the `ProtectedRoute` wrapper because the user is not yet authenticated when the redirect lands.

Routes section after change:
```jsx
<Routes>
  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route index element={<Navigate replace to="dashboard" />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="bookings" element={<Bookings />} />
    <Route path="bookings/:bookingId" element={<Booking />} />
    <Route path="checkin/:bookingId" element={<CheckIn />} />
    <Route path="cabins" element={<Cabins />} />
    <Route path="users" element={<Users />} />
    <Route path="settings" element={<Settings />} />
    <Route path="account" element={<Account />} />
    <Route path="restaurant" element={<Restaurant />} />
  </Route>
  <Route path="login" element={<Login />} />
  <Route path="auth/callback" element={<AuthCallback />} />   {/* NEW */}
  <Route path="forgot-password" element={<ForgotPassword />} />
  <Route path="reset-password" element={<ResetPassword />} />
  <Route path="*" element={<PageNotFound />} />
</Routes>
```

---

### Step 5 — Create `useLoginWithOAuth` Hook

**File:** `src/features/authentication/useLoginWithOAuth.js`

```js
import { useMutation } from "@tanstack/react-query";
import { loginWithOAuth } from "../../services/apiAuth";
import toast from "react-hot-toast";

export function useLoginWithOAuth() {
  const { mutate: loginOAuth, isPending } = useMutation({
    mutationFn: loginWithOAuth,
    onError: (err) => {
      toast.error("Failed to sign in with provider");
    },
  });

  return { loginOAuth, isPending };
}
```

Note: `loginWithOAuth` triggers a browser redirect, so `onSuccess` is never reached client-side (the page navigates away). We keep it as a mutation for consistency and error handling.

---

### Step 6 — Create Shared `OAuthButtons` Component

**File:** `src/features/authentication/OAuthButtons.jsx` **NEW**

Extract the OAuth buttons into a reusable component so it can be shared across both login and signup forms:

```jsx
import Button from "../../ui/Button";
import FormRowVertical from "../../ui/FormRowVertical";
import { useLoginWithOAuth } from "./useLoginWithOAuth";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

function OAuthButtons() {
  const { loginOAuth, isPending } = useLoginWithOAuth();

  return (
    <>
      {/* Divider */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem", margin: "1.2rem 0"
      }}>
        <span style={{ flex: 1, height: "1px", background: "var(--color-grey-200)" }} />
        <span style={{ color: "var(--color-grey-500)", fontSize: "1.2rem" }}>OR</span>
        <span style={{ flex: 1, height: "1px", background: "var(--color-grey-200)" }} />
      </div>

      {/* OAuth Buttons */}
      <FormRowVertical>
        <Button
          size="large"
          variation="secondary"
          onClick={() => loginOAuth("google")}
          disabled={isPending}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.8rem",
          }}
        >
          <FcGoogle style={{ fontSize: "1.8rem" }} />
          Continue with Google
        </Button>
      </FormRowVertical>

      <FormRowVertical>
        <Button
          size="large"
          variation="secondary"
          onClick={() => loginOAuth("github")}
          disabled={isPending}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.8rem",
          }}
        >
          <FaGithub style={{ fontSize: "1.8rem" }} />
          Continue with GitHub
        </Button>
      </FormRowVertical>
    </>
  );
}

export default OAuthButtons;
```

Check that `react-icons` already has `FcGoogle` and `FaGithub`:
- `react-icons` is already in `package.json` ✅ (version `^5.6.0`)
- `FcGoogle` is from `react-icons/fc` — part of the Flat Color icons
- `FaGithub` is from `react-icons/fa` — part of Font Awesome

---

### Step 7 — Add OAuth Buttons to Both Forms

**File:** `src/features/authentication/LoginForm.jsx`

Add import:
```js
import OAuthButtons from "./OAuthButtons";
```

Add before the closing `</Form>` tag — after the existing login button:
```jsx
<OAuthButtons />
```

---

### Step 7b — OAuth is Login-Only

OAuth is **login-only** in this setup. New employees must be created by an admin via the signup form (which adds them to both `auth.users` and `employees`). OAuth sign-in is then gated by the employee guard — only users whose email exists in the `employees` table can complete OAuth login.

---

### Step 8 — Handle Logout

Existing `logout()` in `apiAuth.js` already calls `supabase.auth.signOut()` — this works for both email/password and OAuth sessions. No changes needed.

Same for `Logout.jsx` — it already calls `useLogout()` which works universally.

---

### Step 9 — OAuth-Specific Edge Cases

#### 9.1 Multiple Accounts — Same Email

If a user signs up with email/password and later tries OAuth with the same email, Supabase's default behavior depends on **Identity Linking** setting in the Supabase dashboard:

- **Default (recommended):** Supabase links the OAuth identity to the existing account on login — user keeps their existing account but can now sign in with either method
- **Alternative:** If "Create user if not exists" only, a second account is created

**Recommendation:** In Supabase Dashboard → Authentication → Providers → enable **"Automatically link user accounts"** for each provider. This prevents duplicate accounts.

#### 9.2 Profile Image

OAuth providers return an avatar URL in `user.user_metadata.avatar_url` (Google) or `user.user_metadata.avatar` (GitHub). The existing `UserAvatar.jsx` should already render this since it reads from `user.user_metadata.avatar`. Check and add fallback if not.

#### 9.3 Display Name

OAuth returns `user.user_metadata.full_name` (Google) or `user.user_metadata.user_name` (GitHub). The existing `UpdateUserDataForm.jsx` should allow editing this. No changes needed.

---

### Step 10 — (Optional) Detect OAuth Provider & Show Badge

Add a small label or icon in `UserAvatar.jsx` or the account page to show which provider the user used:

**File:** `src/features/authentication/UserAvatar.jsx` — after reading user data:
```js
const provider = user?.app_metadata?.provider;
// Shows: "Signed in with Google" or "Email & Password"
```

This is a nice-to-have, not required for functionality.

---

### Step 11 — Gate OAuth to Existing Employees Only

**Problem:** OAuth allows anyone with a Google/GitHub account to sign up as an employee.

**Solution:** Create an `employees` table as an allowlist. The `AuthCallback` page checks if the authenticated user's email exists in this table. If not found, they are signed out immediately.

#### 11.1 — Create `employees` Table + RLS Policies

Run in Supabase SQL Editor:

```sql
CREATE TABLE employees (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_authenticated"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "employees_insert_authenticated"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

#### 11.2 — Add Employee Verification to `apiAuth.js`

```js
export async function getEmployeeByEmail(email) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("email", email)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

export async function signOutAndClear() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
```

#### 11.3 — Update `signup()` to Auto-Insert into `employees`

Since `auth.users` is not directly queryable from the client, the `signup()` function in `apiAuth.js` inserts the new employee's email into the `employees` table after creating the auth user:

```js
const { error: insertError } = await supabase
  .from("employees")
  .insert({ email, full_name: fullName })
  .onConflict("email")
  .ignoreDuplicates();
```

#### 11.4 — Update `AuthCallback.jsx`

Replace the simple session check with employee verification:

```jsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import supabase from "../services/supabase";
import { getEmployeeByEmail, signOutAndClear } from "../services/apiAuth";
import Spinner from "../ui/Spinner";
import styled from "styled-components";
import toast from "react-hot-toast";

const FullPage = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-grey-50);
`;

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const email = session.user.email;
      const employee = await getEmployeeByEmail(email);

      if (!employee) {
        await signOutAndClear();
        toast.error("Unauthorized. Only registered employees can sign in.");
        navigate("/login", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    }

    handleCallback();
  }, [navigate]);

  return (
    <FullPage>
      <Spinner />
    </FullPage>
  );
}

export default AuthCallback;
```

#### 11.5 — Seed Existing Employees

Run this once to backfill all existing `auth.users` into `employees`:

```sql
INSERT INTO employees (email, full_name)
SELECT email, raw_user_meta_data->>'fullName'
FROM auth.users
ON CONFLICT (email) DO NOTHING;
```

#### 11.6 — RLS Safety Net

The RLS policy ensures that even if the frontend check is bypassed, the `employees` table is protected:
- Unauthenticated users cannot read or write
- Only authenticated users (employees) can query and insert

---

## Summary of Files to Create/Modify

| Step | Action | File |
|------|--------|------|
| 1 | Supabase Dashboard — enable OAuth providers | No code |
| 2 | Add `loginWithOAuth` service function | `src/services/apiAuth.js` |
| 3 | Create AuthCallback page | `src/pages/AuthCallback.jsx` **NEW** |
| 4 | Add `/auth/callback` route | `src/App.jsx` |
| 5 | Create `useLoginWithOAuth` hook | `src/features/authentication/useLoginWithOAuth.js` **NEW** |
| 6 | Create shared `OAuthButtons` component | `src/features/authentication/OAuthButtons.jsx` **NEW** |
| 7 | Add `OAuthButtons` to `LoginForm.jsx` | `src/features/authentication/LoginForm.jsx` |
| 8 | Create `employees` table + RLS policies in Supabase | Supabase SQL Editor |
| 9 | Modify `signup()` to auto-insert into `employees` | `src/services/apiAuth.js` |
| 10 | Add `getEmployeeByEmail` + `signOutAndClear` to `apiAuth.js` | `src/services/apiAuth.js` |
| 11 | Update `AuthCallback.jsx` with employee guard | `src/pages/AuthCallback.jsx` |
| 12 | Seed existing users into `employees` table | Supabase SQL Editor |

**No new dependencies.** `@supabase/supabase-js` and `react-icons` already cover everything.

---

## Implementation Order

| Step | Description | Est. Time |
|------|-------------|-----------|
| 1 | Supabase Dashboard: enable Google OAuth, configure redirect URIs | 10 min |
| 2 | Create `loginWithOAuth` in `apiAuth.js` | 5 min |
| 3 | Create `useLoginWithOAuth.js` hook | 5 min |
| 4 | Create `AuthCallback.jsx` page | 10 min |
| 5 | Add route to `App.jsx` | 2 min |
| 6 | Create shared `OAuthButtons` component | 10 min |
| 7 | Add `OAuthButtons` to `LoginForm.jsx` | 2 min |
| 8 | Create `employees` table + RLS in Supabase SQL Editor | 5 min |
| 9 | Modify `signup()` to insert into `employees` | 5 min |
| 10 | Add `getEmployeeByEmail` + `signOutAndClear` to `apiAuth.js` | 5 min |
| 11 | Update `AuthCallback.jsx` with employee guard | 10 min |
| 12 | Seed existing users into `employees` | 2 min |
| 13 | Test: local dev with `http://localhost:5173` | 5 min |

**Total:** ~76 min

---

## Key Considerations

- **No password management needed** — OAuth users don't need "forgot password" flow, but the button is harmless (it just won't apply to them)
- **User data from provider is read-only** — if you need to enforce specific `fullName` formatting, add a one-time prompt after first OAuth login
- **Session persistence** — Supabase stores session in `localStorage` automatically. User stays logged in across page refreshes. Works identically to email/password.
- **Rate limiting** — Supabase Auth has built-in rate limiting for OAuth. No additional handling needed.
- **CORS / redirect** — If deploying on Netlify, ensure `_redirects` or `netlify.toml` doesn't block `/auth/callback`. The current setup should be fine since it's a client-side route.
- **Logout** — `supabase.auth.signOut()` clears the session for both email and OAuth users equally.
