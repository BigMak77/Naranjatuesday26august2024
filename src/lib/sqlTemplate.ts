// src/lib/sqlTemplate.ts
export function compile(sql: string, params: Record<string, string>) {
  let out = sql;
  for (const [k,v] of Object.entries(params)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}
