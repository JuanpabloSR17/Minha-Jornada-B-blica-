import bible from '../bible-books.json';
import { activeMs, activeSeconds, formatClock, freezeForFinish, markPending, nextChapter, pauseMission, restoreMission, resumeMission, startMission, uuidv4 } from '../mission/session';

const T0 = 1_700_000_000_000;
const base = () => startMission({ userId: 'u1', book: 'GEN', chapter: 1, mode: 'physical' }, T0, 'sess-1');

describe('sessão de missão', () => {
  it('conta o tempo ativo pelas marcas de tempo (sobrevive a bloquear a tela e reabrir)', () => {
    const s = base();
    expect(activeMs(s, T0 + 90_000)).toBe(90_000);
    // "reabrir o app": a sessão serializada e lida de novo continua contando
    const reopened = JSON.parse(JSON.stringify(s));
    expect(activeSeconds(reopened, T0 + 125_000)).toBe(125);
  });

  it('pausar para de contar; retomar volta a contar só o tempo ativo', () => {
    let s = pauseMission(base(), T0 + 60_000);
    expect(s.status).toBe('paused');
    expect(activeMs(s, T0 + 600_000)).toBe(60_000); // 9 minutos pausado não contam
    s = JSON.parse(JSON.stringify(s)); // persistido e restaurado enquanto pausado
    s = resumeMission(s, T0 + 600_000);
    expect(activeMs(s, T0 + 630_000)).toBe(90_000);
    expect(pauseMission(pauseMission(s, T0 + 630_000), T0 + 700_000).accumulatedMs).toBe(90_000);
  });

  it('relógio do aparelho voltando no tempo não reduz o total', () => {
    expect(activeMs(base(), T0 - 50_000)).toBe(0);
  });

  it('finalizar congela o tempo; falha vira pendente com o mesmo ID e o mesmo tempo', () => {
    const f = freezeForFinish(base(), T0 + 300_000);
    expect(f.status).toBe('finishing');
    expect(activeMs(f, T0 + 999_000)).toBe(300_000);
    const p = markPending(f, 'sem conexão');
    expect(p.id).toBe('sess-1');
    expect(p.status).toBe('pending');
    const retry = freezeForFinish(p, T0 + 999_000);
    expect(retry.id).toBe('sess-1');
    expect(activeMs(retry, T0 + 999_000)).toBe(300_000);
  });

  it('app fechado durante a finalização: ao reabrir, a sessão volta como pendente', () => {
    expect(restoreMission(freezeForFinish(base(), T0 + 10_000)).status).toBe('pending');
    expect(restoreMission(base()).status).toBe('running');
  });

  it('ID da sessão é um UUID v4', () => {
    expect(uuidv4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuidv4()).not.toBe(uuidv4());
  });

  it('formata o cronômetro e acha o próximo capítulo', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(754_000)).toBe('12:34');
    expect(formatClock(3_661_000)).toBe('1:01:01');
    expect(nextChapter(bible, 'GEN', 50)).toEqual({ book: 'EXO', chapter: 1 });
    expect(nextChapter(bible, 'RUT', 2)).toEqual({ book: 'RUT', chapter: 3 });
    expect(nextChapter(bible, 'REV', 22)).toBeNull();
  });
});

describe('sessão vinculada a um marco dos Santos', () => {
  it('o marco fica na sessão ao pausar, reabrir o app e após falha na finalização', () => {
    let s = startMission({ userId: 'u1', book: 'EXO', chapter: 25, mode: 'physical', milestone: 'marco_mobilia_do_tabernaculo' }, T0, 'sess-m');
    s = pauseMission(s, T0 + 10_000);
    s = JSON.parse(JSON.stringify(s)); // reabrir o app
    s = resumeMission(s, T0 + 20_000);
    s = markPending(freezeForFinish(s, T0 + 30_000), 'sem conexão');
    s = restoreMission(JSON.parse(JSON.stringify(s)));
    expect(s.milestone).toBe('marco_mobilia_do_tabernaculo');
    expect(s.id).toBe('sess-m');
    expect(startMission({ userId: 'u1', book: 'EXO', chapter: 16, mode: 'physical' }, T0, 'x').milestone).toBeNull();
  });
});
