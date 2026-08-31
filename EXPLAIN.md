# EXPLAIN — Adding OIDC Auth to Upsilon Labs

This document explains, from start to finish, exactly how we added login/register
authentication to the Upsilon Labs static site (`upsilonlabs.me`) using your
self-hosted OIDC Identity Provider (IDP) and a Cloudflare Worker.

---

## The Big Picture / Mental Model

```
Browser (upsilonlabs.me)
   │
   │ 1. Click "Login" / "Register"
   ▼
Cloudflare Worker  (upsilonlabs-auth.gattucharanteja8143.workers.dev)
   │  /auth   -> builds OIDC URL (PKCE) and redirects you
   ▼
Your OIDC IDP  (signfuncapp.blackisland-65d7ed7f.uaenorth.azurecontainerapps.io)
   │  shows login/register page -> you authenticate
   ▼
IDP redirects browser back to the Worker's /callback with an auth code
   │
   ▼
Worker
   │  - exchanges code for tokens (ID token + access token)
   │  - fetches your profile from the IDP's /me (userinfo)
   │  - signs a session cookie and sets it
   ▼
Redirect to https://upsilonlabs.me/admin  (React app shows the dashboard)
```

**Key idea:** The static React site on GitHub Pages cannot hold a secret or exchange
auth codes (no backend). The Cloudflare Worker is the "backend" that does the
OAuth legwork and hands the browser a signed cookie so the site knows who you are.

---

## Step 0 — What existed before

The repo was a **static React + TypeScript + Vite SPA** (landing page) deployed to
GitHub Pages. It had:
- No router
- No auth
- No backend whatsoever
- Components: Navbar, Hero, About, Services, ProjectsCarousel, Contact, Footer

---

## Step 1 — Register the client on the IDP (you did this)

You registered a new OIDC client on the Azure-hosted IDP via `CLIENTS_JSON`:

| Field | Value |
|-------|-------|
| `client_id` | `upsilon` |
| `client_secret` | `upsilonS` |
| `client_name` | `Upsilon Labs` |
| `redirect_uris` | `https://upsilonlabs-auth.gattucharanteja8143.workers.dev/callback` |
| `post_logout_redirect_uris` | `https://upsilonlabs.me` |
| `grant_types` | `authorization_code, refresh_token` |
| `response_types` | `code` |
| `token_endpoint_auth_method` | `client_secret_basic` |
| `scope` | `openid profile email offline_access` |

> ⚠️ **Gotcha we hit:** the IDP rejected client requests with
> `invalid_client_metadata / client_name must be a non-empty string`.
> Your `client_name` was `null`. Setting it to `"Upsilon Labs"` fixed it.

> ⚠️ **Another gotcha:** your first registered redirect URI was
> `https://upsilonlabs.me/callback`, but the actual callback lives on the Worker.
> It had to be changed to the Worker's `/callback` URL.

---

## Step 2 — Create the Cloudflare Worker (the backend)

We created a Worker project under `auth-worker/black-scene-2be4/` using
Cloudflare's "Worker only" template, then replaced the "Hello World" with a real
OIDC relying-party server.

### Config — `wrangler.jsonc`
Environment variables (non-secret) live here:

```jsonc
"vars": {
  "IDP_URL": "https://signfuncapp...azurecontainerapps.io",
  "CLIENT_ID": "upsilon",
  "REDIRECT_URI": "https://upsilonlabs-auth.gattucharanteja8143.workers.dev/callback",
  "APP_URL": "https://upsilonlabs.me",
  "SCOPES": "openid profile email offline_access"
}
```

Secrets (set separately via `wrangler secret put`, never committed):
- `CLIENT_SECRET` → `upsilonS`
- `COOKIE_SECRET` → random 32-byte value (used to sign session cookies)

Initially we planned to use `itty-router` + `jose`, but the Worker kept
"hanging" (the runtime canceled requests). We rewrote it using **pure Web
APIs only** (Web Crypto, `Response`, `URL`) — no npm dependencies. This is more
reliable on Workers and removed the hang.

### The Worker endpoints — `src/index.js`

| Route | Method | What it does |
|-------|--------|--------------|
| `/` | GET | health check (`{ status: "ok" }`) |
| `/auth` | GET | starts login: creates a random `state` + PKCE `code_verifier`, signs them into a short-lived `auth_pkce` cookie, and redirects the browser to the IDP's `/auth` URL with the `code_challenge`. |
| `/callback` | GET | the IDP redirects here with an auth `code`. The Worker verifies `state`, exchanges the code at the IDP `/token` endpoint, decodes claims, fetches `/me` (userinfo), signs a long-lived `auth_session` cookie, and redirects to `APP_URL/admin`. |
| `/me` | GET | reads the `auth_session` cookie, verifies it, returns `{ authenticated, user }` or `401`. Called by the React app to know who is logged in. |
| `/logout` | GET | clears the `auth_session` cookie and redirects to the IDP end-session endpoint `/session/end`. |

### Security details implemented
- **PKCE (S256)**: `code_verifier` is random per login; the IDP requires the
  matching `code_challenge`. Prevents interception of the auth code.
- **`state`** parameter: prevents CSRF/replay of the callback.
- **Signed session cookie**: an HMAC-SHA256 compact JWT (header.payload.signature)
  signed with `COOKIE_SECRET`. `HttpOnly` (JS can't read it), `Secure`, `SameSite=None`.
- **`SameSite=None`** (not `Lax`): required because the cookie is set on the
  `workers.dev` domain but read via a cross-site `fetch` from `upsilonlabs.me`.
- **CORS with credentials**: the `/me` endpoint echoes the exact allowed origin
  (`https://upsilonlabs.me`) and sends `Access-Control-Allow-Credentials: true`.
  A wildcard `*` would have been rejected by the browser when credentials were included.

---

## Step 3 — Update the React site

### New dependency
- `react-router-dom` — for page routing (`/`, `/login`, `/admin`).

### New/changed files

| File | Purpose |
|------|---------|
| `src/context/AuthContext.tsx` | React context holding `user`, `loading`, `authenticated`, plus `login()` and `logout()`. On mount it calls the Worker `/me` to see if a session exists. `login()`/`logout()` just `window.location.href = <worker>/auth | /logout`. The worker URL is **hardcoded** here. |
| `src/pages/Login.tsx` | Renders the **Login** and **Register** buttons. Both call `login()` (redirect to the IDP). Shows any error passed back via query string. |
| `src/pages/AdminDashboard.tsx` | The protected page. If not authenticated it redirects to `/login`. Otherwise it shows the user's name, email, subject, etc., plus a Logout button. |
| `src/App.tsx` | Now uses `<Routes>`: `/` = landing page, `/login` = Login page, `/admin` = Admin dashboard. |
| `src/main.tsx` | Wraps the app in `<BrowserRouter>` and `<AuthProvider>`. |
| `src/components/Navbar.tsx` | Shows a **Login** button when logged out, or the user's name + **Logout** when logged in. |
| `src/App.css` | Added styles for the login page and admin dashboard (dark theme matching the site). |

### Hardcoding the auth URL (your request)
The `.env` file was removed and the Worker URL is written directly in
`AuthContext.tsx`:

```ts
const AUTH_URL = 'https://upsilonlabs-auth.gattucharanteja8143.workers.dev'
```

### SPA routing on GitHub Pages — `vite.config.ts`
GitHub Pages only serves a static folder, and doesn't know about client-side
routes like `/login` or `/admin`. It serves `404.html` for unknown paths. So we
added a small Vite plugin (`spaFallback`) that copies the built `index.html` to
`404.html`. Now `/login` and `/admin` load the React app (whose router takes
over). The browser still reports the HTTP status as 404 on those paths, but the
app renders correctly — this is the normal GitHub Pages SPA pattern.

---

## Step 4 — Bugs we found & fixed during live browser testing

The whole flow was tested with a real browser against the deployed IDP. These
are the issues discovered and resolved:

1. **IDP `client_name` = null** → IDP returned 400 `invalid_client_metadata`.
   Fixed on the IDP config (set to `"Upsilon Labs"`).

2. **Redirect URI mismatch** → had to point at the Worker, not upsilonlabs.me.

3. **CORS blocked `/me`** → error:
   `Access-Control-Allow-Origin must not be the wildcard '*' when credentials are include`.
   Fixed by echoing the specific origin + `Allow-Credentials: true`.

4. **Session cookie not read cross-site** → after login the dashboard showed
   logged out. The cookie was `SameSite=Lax`, which browsers don't send on
   cross-site `fetch` requests. Fixed by switching to `SameSite=None; Secure`.

5. **Logout hit a 404** → error `unrecognized route ... GET on /logout`.
   The IDP's discovery document shows the real end-session endpoint is
   `/session/end`. Fixed the Worker to call that.

6. **Name/email showed "Unknown"** → the ID token alone lacked full claims for
   some users. Fixed by also calling the IDP's `/me` (userinfo) endpoint with the
   access token during the callback to enrich the profile.

---

## Step 5 — Deployment

- **Worker** is deployed independently: `npm run deploy` inside
  `auth-worker/black-scene-2be4/` → pushed to
  `https://upsilonlabs-auth.gattucharanteja8143.workers.dev`.
- **React site** deploys automatically via the existing GitHub Actions workflow
  (`.github/workflows/deploy.yml`) whenever we push to `main`. We committed the
  changes and pushed, which built `dist` (including the `404.html` fallback) and
  published it to GitHub Pages → `https://upsilonlabs.me`.

---

## Step 6 — What was verified end-to-end (with a live browser)

1. Opened `https://upsilonlabs.me/login` → Login page renders.
2. Clicked **Register** → browser redirected to the IDP.
3. Clicked **Create an account** → filled Full name / Email / Username / Password.
4. On submit the IDP redirected to the Worker `/callback`, which exchanged the code.
5. Landed on `https://upsilonlabs.me/admin` showing:
   - **Welcome, Jane Doe!**
   - Name: Jane Doe, Email: janedoe@example.com, Verified: Yes, Subject: usr_...
6. Clicked **Logout** → IDP "Sign-out Success" and the session cookie was cleared.
7. Visiting `/admin` again redirected back to `/login` (correctly protected).

---

## Where things live — reference

| Thing | Location |
|-------|----------|
| Auth Worker source | `auth-worker/black-scene-2be4/src/index.js` |
| Auth Worker config | `auth-worker/black-scene-2be4/wrangler.jsonc` |
| React auth context | `src/context/AuthContext.tsx` |
| Login page | `src/pages/Login.tsx` |
| Admin dashboard | `src/pages/AdminDashboard.tsx` |
| App routes | `src/App.tsx`, `src/main.tsx` |
| Navbar auth buttons | `src/components/Navbar.tsx` |
| SPA fallback plugin | `vite.config.ts` |
| Styles for auth pages | `src/App.css` |

---

## How to add a new protected page later

1. Create a component in `src/pages/`.
2. Wrap it with the auth guard pattern (like `AdminDashboard`): read
   `useAuth()`, and `navigate('/login')` when `!loading && !user`.
3. Register the route in `src/App.tsx`.

---

## How to test locally (optional)

You can't fully test the OIDC flow from `localhost` because the IDP only allows
`https://upsilonlabs.me` as the callback. To test locally you would need to add
`http://localhost:5173/callback` (or similar) to the IDP's `redirect_uris` and
point `REDIRECT_URI`/`APP_URL` at localhost. For most work, it's easiest to just
deploy and test on the live site.
