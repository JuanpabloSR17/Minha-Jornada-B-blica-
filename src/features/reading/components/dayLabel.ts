/** "2026-11-21" → "21/11". */
export const dayLabel = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};
