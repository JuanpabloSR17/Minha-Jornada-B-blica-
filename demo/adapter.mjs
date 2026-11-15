import { PGliteWorker } from './pglite/worker/index.js';

const DEMO_ID = 'd03f6ee7-dbf8-4294-af42-83e15d8c0c13';
const email = 'viajante@demonstracao.invalid';
let connection;

const rpcNames = new Set([
  'get_my_avatar', 'save_avatar', 'get_wardrobe', 'save_wardrobe', 'equip_item', 'unequip_slot',
  'create_loadout', 'rename_loadout', 'activate_loadout', 'delete_loadout', 'get_collections',
  'get_public_avatar', 'set_privacy_mode', 'get_reading_progress', 'get_next_reading',
  'get_world_progress', 'complete_reading_mission', 'get_mission_overview', 'get_daily_goal_status',
  'claim_daily_goal_item', 'sync_time_zone', 'set_time_zone', 'set_daily_mission_target',
  'get_market', 'purchase_market_item', 'set_reading_preferences',
]);
const projections = {
  profiles: ['id', 'username', 'display_name', 'privacy_mode', 'avatar_onboarding_completed_at', 'onboarding_completed_at'],
  reading_preferences: ['plan_mode', 'target_chapters_per_day', 'pending_plan_mode', 'pending_target', 'pending_effective_day'],
  user_items: ['item_id'],
};

const now = new Date().toISOString();
const user = {
  id: DEMO_ID, aud: 'authenticated', role: 'authenticated', email,
  created_at: now, updated_at: now, email_confirmed_at: now, app_metadata: {}, user_metadata: {},
};

function session() {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const b64 = (object) => btoa(JSON.stringify(object)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return {
    access_token: `${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:DEMO_ID,role:'authenticated',aud:'authenticated',exp:expiry})}.ZGVtbw`,
    refresh_token: DEMO_ID, token_type: 'bearer', expires_in: 3600, expires_at: expiry, user,
  };
}

function database() {
  connection ??= PGliteWorker.create(new Worker(new URL('./database.mjs', import.meta.url), { type: 'module' }), {
    id: 'jornada-piloto-v1',
  }).catch((error) => {
    connection = undefined;
    throw error;
  });
  return connection;
}

const json = (value, status = 200) => Response.json(value, { status });
const pgArgs = (value) => value && typeof value === 'object' ? JSON.stringify(value) : value;

async function queryAsDemo(fn) {
  const pg = await database();
  return pg.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [DEMO_ID]);
    return fn(tx);
  });
}

async function localRpc(request, name) {
  const args = Object.entries(await request.json());
  if (args.some(([key]) => !/^p_[a-z_]+$/.test(key))) return json({message: 'invalid_args'}, 400);
  const inputs = args.map(([key], i) => `${key} => $${i + 1}`).join(', ');
  return queryAsDemo(async (tx) => {
    const { rows } = await tx.query(`select to_jsonb(public.${name}(${inputs})) as result`, args.map(([, v]) => pgArgs(v)));
    return json(rows[0].result);
  });
}

async function readTable(request, url, table) {
  const columns = (url.searchParams.get('select') ?? '').split(',').map((text) => text.trim());
  if (columns.some((column) => !projections[table].includes(column))) return json({message: 'invalid_projection'}, 400);
  const single = request.headers.get('accept')?.includes('vnd.pgrst.object');
  return queryAsDemo(async (tx) => {
    const { rows } = await tx.query(`select ${columns.join(', ')} from public.${table}`);
    return json(single ? (rows[0] ?? null) : rows);
  });
}

window.jornadaDemoFetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  try {
    if (url.pathname === '/auth/v1/token') {
      await database();
      return json(session());
    }
    if (url.pathname === '/auth/v1/user') return json(user);
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    const rpc = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(url.pathname)?.[1];
    if (rpcNames.has(rpc) && request.method === 'POST') return await localRpc(request, rpc);
    const table = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname)?.[1];
    if (Object.hasOwn(projections, table) && request.method === 'GET') return await readTable(request, url, table);
    return json({message:'Função indisponível na demonstração'}, 404);
  } catch (error) {
    return json({code:error.code ?? 'demo_error', message:error.message ?? 'Demonstração indisponível'}, 400);
  }
};
