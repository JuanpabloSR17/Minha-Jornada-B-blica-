import { PGlite } from './pglite/index.js';
import { worker } from './pglite/worker/index.js';

const DEMO_ID = 'd03f6ee7-dbf8-4294-af42-83e15d8c0c13';
const demoPath = 'idb://jornada-biblica-piloto-v1';

worker({
  async init() {
    const db = await PGlite.create(demoPath);
    await db.transaction(async (tx) => {
      const state = await tx.query("select to_regclass('public.profiles') is not null as initialized");
      if (state.rows[0].initialized) return;
      const response = await fetch(new URL('./migration.sql', import.meta.url));
      if (!response.ok) throw new Error('Não foi possível iniciar os dados da demonstração');
      await tx.exec(await response.text());
      await tx.query("insert into auth.users (id, email) values ($1, 'viajante@demonstracao.invalid')", [DEMO_ID]);
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [DEMO_ID]);
      await tx.exec(`
        select public.claim_profile('viajante_demo', 'Viajante');
        select public.save_avatar(
          '{"bodyId":"body-b","skinToneId":"skin-4","hairStyleId":"hair-short","hairColorId":"haircolor-black","eyesId":"eyes-almond","browsId":"brows-soft","expressionId":"expr-smile","beardId":"beard-none"}'::jsonb,
          '{"outfit":"tunic-linen","feet":"sandals-leather","hands":"staff-shepherd"}'::jsonb
        );
        select public.set_reading_preferences('daily_goal', 1);
      `);
      await tx.query(
        "insert into public.siclos_ledger (user_id,event_type,source_event_id,amount) values ($1,'DEMO_GRANT','piloto',80)",
        [DEMO_ID],
      );
    });
    return db;
  },
});
