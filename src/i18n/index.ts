import { ptBR } from './pt-BR';

export const strings = ptBR;

/** Interpola "{chave}" numa string. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? `{${k}}`));
}
