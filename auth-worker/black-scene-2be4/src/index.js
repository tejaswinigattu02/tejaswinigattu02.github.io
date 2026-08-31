const ALLOWED_ORIGINS = new Set([
  'https://upsilonlabs.me',
  'http://localhost:5173',
  'https://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
]);

function corsHeadersFor(request) {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  return {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function redirect(url, status = 302) {
  return Response.redirect(url, status);
}

// Redirect with extra headers (Response.redirect() headers are immutable)
function redirectWithHeaders(url, headers, status = 302) {
  return new Response(null, {
    status,
    headers: { location: url, ...headers },
  });
}

// --- crypto helpers (pure Web Crypto, no btoa spread) ---

function bytesToBase64url(bytes) {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBytes(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function sha256B64url(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64url(new Uint8Array(hash));
}

function randomBytes(n) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return bytesToBase64url(arr);
}

// --- HMAC-signed token (no jose dependency) ---

async function hmacKey(secret) {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function hmacSign(secret, message) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToBase64url(new Uint8Array(sig));
}

async function hmacVerify(secret, message, signature) {
  try {
    const key = await hmacKey(secret);
    const expected = bytesToBase64url(
      new Uint8Array(
        await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
      )
    );
    return expected === signature;
  } catch {
    return false;
  }
}

function b64urlEncodeJson(obj) {
  return bytesToBase64url(new TextEncoder().encode(JSON.stringify(obj)));
}

function b64urlDecodeJson(str) {
  return JSON.parse(new TextDecoder().decode(base64urlToBytes(str)));
}

// Simple compact JWT: header.payload.signature, HMAC-SHA256
async function signToken(payload, secret, expiresInSec = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const headerB64 = b64urlEncodeJson(header);
  const payloadB64 = b64urlEncodeJson(body);
  const signature = await hmacSign(secret, `${headerB64}.${payloadB64}`);
  return `${headerB64}.${payloadB64}.${signature}`;
}

async function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signature] = parts;
  const valid = await hmacVerify(secret, `${headerB64}.${payloadB64}`, signature);
  if (!valid) return null;
  const payload = b64urlDecodeJson(payloadB64);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// --- cookie helpers ---

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((c) => {
    const idx = c.indexOf('=');
    if (idx === -1) return;
    cookies[c.slice(0, idx).trim()] = decodeURIComponent(c.slice(idx + 1).trim());
  });
  return cookies;
}

// --- routing ---

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeadersFor(request) });
  }

  let response;
  if (request.method === 'GET' && pathname === '/') {
    response = json({ status: 'ok', service: 'upsilonlabs-auth' });
  } else if (request.method === 'GET' && pathname === '/auth') {
    response = await startAuth(env);
  } else if (request.method === 'GET' && pathname === '/callback') {
    response = await handleCallback(request, env);
  } else if (request.method === 'GET' && pathname === '/me') {
    response = await handleMe(request, env);
  } else if (request.method === 'GET' && pathname === '/logout') {
    response = await handleLogout(env);
  } else {
    response = json({ error: 'Not found' }, 404);
  }

  // Add CORS headers to every response for cross-origin calls from the app
  const cors = corsHeadersFor(request);
  if (cors['Access-Control-Allow-Origin']) {
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: { ...Object.fromEntries(response.headers), ...cors },
    });
  }
  return response;
}

// 1) Start OIDC flow: redirect to IDP with PKCE
async function startAuth(env) {
  const state = randomBytes(32);
  const codeVerifier = randomBytes(32);
  const codeChallenge = await sha256B64url(codeVerifier);

  const sessionData = { state, codeVerifier };
  const cookieToken = await signToken(sessionData, env.COOKIE_SECRET, 600);

  const authUrl = new URL(`${env.IDP_URL}/auth`);
  authUrl.searchParams.set('client_id', env.CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', env.REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', env.SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return redirectWithHeaders(authUrl.toString(), {
    'Set-Cookie': `auth_pkce=${cookieToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  });
}

// 2) Callback from IDP: exchange code for tokens
async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return redirect(`${env.APP_URL}/login?error=${encodeURIComponent(error)}`);
  }
  if (!code || !state) {
    return redirect(`${env.APP_URL}/login?error=missing_code`);
  }

  const cookies = parseCookies(request.headers.get('Cookie'));
  const pkceToken = cookies['auth_pkce'];
  if (!pkceToken) {
    return redirect(`${env.APP_URL}/login?error=no_session`);
  }

  let sessionData;
  try {
    sessionData = await verifyToken(pkceToken, env.COOKIE_SECRET);
  } catch {
    return redirect(`${env.APP_URL}/login?error=session_expired`);
  }
  if (!sessionData || sessionData.state !== state) {
    return redirect(`${env.APP_URL}/login?error=state_mismatch`);
  }

  const creds = bytesToBase64url(
    new TextEncoder().encode(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`)
  );

  const tokenRes = await fetch(`${env.IDP_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${creds}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.REDIRECT_URI,
      code_verifier: sessionData.codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Token exchange failed:', tokenRes.status, errText);
    return redirect(`${env.APP_URL}/login?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json();

  // Build user from ID token first, then enrich with userinfo endpoint
  let user = { name: 'Unknown', email: '', email_verified: false };
  try {
    const payloadB64 = tokens.id_token.split('.')[1];
    const payload = b64urlDecodeJson(payloadB64);
    user = {
      sub: payload.sub,
      name: payload.name || payload.preferred_username || 'Unknown',
      email: payload.email || '',
      email_verified: payload.email_verified || false,
    };
  } catch (e) {
    console.error('Failed to decode ID token:', e);
    // continue with fallback user below
  }

  // Enrich with userinfo endpoint (authorizationBearer) for reliable claims
  if (tokens.access_token) {
    try {
      const uiRes = await fetch(`${env.IDP_URL}/me`, {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });
      if (uiRes.ok) {
        const profile = await uiRes.json();
        user = {
          sub: user.sub || profile.sub,
          name: profile.name || profile.preferred_username || user.name || 'Unknown',
          email: profile.email || user.email || '',
          email_verified: profile.email_verified ?? user.email_verified ?? false,
        };
      }
    } catch (e) {
      console.error('Userinfo fetch failed:', e);
    }
  }

  const sessionToken = await signToken(
    {
      user,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : undefined,
    },
    env.COOKIE_SECRET,
    86400
  );

  return redirectWithHeaders(`${env.APP_URL}/admin`, {
    'Set-Cookie': `auth_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=86400`,
  });
}

// 3) Current user
async function handleMe(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const sessionToken = cookies['auth_session'];
  if (!sessionToken) {
    return json({ authenticated: false }, 401);
  }
  try {
    const session = await verifyToken(sessionToken, env.COOKIE_SECRET);
    if (!session) return json({ authenticated: false }, 401);
    return json({ authenticated: true, user: session.user });
  } catch {
    return json({ authenticated: false }, 401);
  }
}

// 4) Logout
async function handleLogout(env) {
  const postLogoutUri = encodeURIComponent(env.APP_URL);
  // IDP end_session_endpoint (from its discovery document)
  return redirectWithHeaders(`${env.IDP_URL}/session/end?post_logout_redirect_uri=${postLogoutUri}`, {
    'Set-Cookie': `auth_session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`,
  });
}

export default {
  async fetch(request, env, _ctx) {
    return handleRequest(request, env);
  },
};