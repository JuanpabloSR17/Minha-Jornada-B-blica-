// Utilitários do roteiro de validação contra um Supabase real (local via CLI ou projeto de testes).
// Variáveis: SUPABASE_URL, SUPABASE_ANON_KEY (chave pública) e DB_URL (conexão Postgres do projeto
// de TESTES, usada só para datas controladas e para conferir registros). Nunca use produção.
const { createClient } = require('@supabase/supabase-js');
const pg = require('pg');
const fs = require('node:fs');
const path = require('node:path');

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY;
const DB_URL = process.env.DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const STATE = process.env.STATE_FILE ?? path.join(__dirname, '.state.json');
const PASSWORD = 'senha-forte-teste-123';
if (!ANON) throw new Error('Defina SUPABASE_ANON_KEY (chave pública do projeto de testes).');

const results = [];
const ok = (msg) => { results.push(msg); console.log(`  ✔ ${msg}`); };
const client = () => createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(email) {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return { c, uid: data.user.id };
}

/** Executa uma RPC e devolve { data, code } (code = mensagem de erro estável do servidor). */
async function rpc(c, fn, args) {
  const { data, error } = await c.rpc(fn, args);
  return { data, code: error ? error.message : null, error };
}

const db = () => new pg.Client({ connectionString: DB_URL });
const loadState = () => JSON.parse(fs.readFileSync(STATE, 'utf8'));
const saveState = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 2));

module.exports = { URL, ANON, DB_URL, PASSWORD, ok, client, signIn, rpc, db, loadState, saveState, results };
