// SOMENTE PARA TESTES LOCAIS.
// Imita o subconjunto HTTP do Supabase (Auth + PostgREST) que o app usa, executando
// as consultas e RPCs REAIS das migrações num Postgres local, como papel "authenticated"
// com o "sub" do token — como o PostgREST faz. Não verifica assinatura de JWT,
// não envia e-mails e não deve ser exposto em rede.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54321);
const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: 'postgres',
  database: process.env.PGDATABASE ?? 'jb_test',
});
const users = new Map(); // email -> { id, password, email, refresh }

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function makeToken(user) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = { sub: user.id, role: 'authenticated', email: user.email, exp, aud: 'authenticated' };
  return { exp, jwt: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.ZmFrZQ` };
}
function subFrom(req) {
  const auth = req.headers.authorization ?? '';
  const tok = auth.replace(/^Bearer /, '').split('.')[1];
  try {
    const p = JSON.parse(Buffer.from(tok, 'base64url').toString());
    return p.role === 'authenticated' && p.exp > Date.now() / 1000 ? p.sub : null;
  } catch {
    return null;
  }
}
const userJson = (u) => ({
  id: u.id,
  aud: 'authenticated',
  role: 'authenticated',
  email: u.email,
  email_confirmed_at: u.created_at,
  created_at: u.created_at,
  updated_at: u.created_at,
  app_metadata: { provider: 'email' },
  user_metadata: {},
  identities: [],
});
function session(u) {
  const t = makeToken(u);
  u.refresh = randomUUID();
  return { access_token: t.jwt, token_type: 'bearer', expires_in: 3600, expires_at: t.exp, refresh_token: u.refresh, user: userJson(u) };
}

async function asRole(sub, fn) {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query(`set local role ${sub ? 'authenticated' : 'anon'}`);
    if (sub) await c.query("select set_config('request.jwt.claim.sub', $1, true)", [sub]);
    const r = await fn(c);
    await c.query('commit');
    return r;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

const IDENT = /^[a-z_][a-z0-9_]*$/;
const pgError = (e) => ({
  status: e.code === '42501' ? 403 : e.code === '28000' ? 401 : 400,
  body: { code: e.code, message: e.message, details: e.detail ?? null, hint: e.hint ?? null },
});

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': '*',
    'access-control-expose-headers': '*',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
const readBody = (req) =>
  new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => {
      try {
        resolve(d ? JSON.parse(d) : {});
      } catch {
        resolve({});
      }
    });
  });

http
  .createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204);
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;
    try {
      // ---------------- Auth ----------------
      if (path === '/auth/v1/signup' && req.method === 'POST') {
        const { email, password } = await readBody(req);
        if (users.has(email)) return send(res, 422, { code: 'user_already_exists', error_code: 'user_already_exists', msg: 'User already registered' });
        const u = { id: randomUUID(), email, password, created_at: new Date().toISOString() };
        await pool.query('insert into auth.users (id, email) values ($1, $2)', [u.id, email]);
        users.set(email, u);
        return send(res, 200, session(u));
      }
      if (path === '/auth/v1/token' && req.method === 'POST') {
        const body = await readBody(req);
        if (url.searchParams.get('grant_type') === 'password') {
          const u = users.get(body.email);
          if (!u || u.password !== body.password) return send(res, 400, { code: 'invalid_credentials', error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
          return send(res, 200, session(u));
        }
        const u = [...users.values()].find((x) => x.refresh === body.refresh_token);
        if (!u) return send(res, 400, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
        return send(res, 200, session(u));
      }
      if (path === '/auth/v1/user') {
        const sub = subFrom(req);
        const u = [...users.values()].find((x) => x.id === sub);
        return u ? send(res, 200, userJson(u)) : send(res, 401, { msg: 'invalid JWT' });
      }
      if (path === '/auth/v1/logout') return send(res, 204);

      // ---------------- PostgREST ----------------
      const sub = subFrom(req);
      const rpc = path.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/);
      if (rpc && IDENT.test(rpc[1])) {
        const args = await readBody(req);
        const keys = Object.keys(args).filter((k) => IDENT.test(k));
        const params = keys.map((k) => (args[k] !== null && typeof args[k] === 'object' ? JSON.stringify(args[k]) : args[k]));
        const sql = `select to_jsonb(public.${rpc[1]}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')})) as r`;
        const out = await asRole(sub, (c) => c.query(sql, params));
        return send(res, 200, out.rows[0].r);
      }
      const tbl = path.match(/^\/rest\/v1\/([a-z_]+)$/);
      if (tbl && req.method === 'GET' && IDENT.test(tbl[1])) {
        const cols = (url.searchParams.get('select') ?? '*').split(',').map((s) => s.trim());
        if (!cols.every((c) => c === '*' || IDENT.test(c))) return send(res, 400, { message: 'bad select' });
        const where = [];
        const vals = [];
        for (const [k, v] of url.searchParams) {
          if (k === 'select' || !IDENT.test(k)) continue;
          const m = v.match(/^eq\.(.*)$/);
          if (m) {
            vals.push(m[1]);
            where.push(`${k} = $${vals.length}`);
          }
        }
        const sql = `select ${cols.join(', ')} from public.${tbl[1]}${where.length ? ' where ' + where.join(' and ') : ''}`;
        const out = await asRole(sub, (c) => c.query(sql, vals));
        return send(res, 200, out.rows);
      }
      return send(res, 404, { message: 'rota não suportada pelo fake-supabase' });
    } catch (e) {
      const { status, body } = pgError(e);
      return send(res, status, body);
    }
  })
  .listen(PORT, () => console.log(`fake-supabase em http://localhost:${PORT}`));
