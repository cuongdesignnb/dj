// Dot-path access for form values ("venue.name", "seo.title").

export type Values = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getPath(source: unknown, path: string): unknown {
  let current: unknown = source;
  for (const part of path.split('.')) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }
  return current;
}

/** Returns a copy with the value set; intermediate objects are created as needed. */
export function setPath<T extends Values>(source: T, path: string, value: unknown): T {
  const parts = path.split('.');
  const root: Values = { ...source };
  let cursor: Values = root;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
    } else {
      const next = cursor[part];
      cursor[part] = isRecord(next) ? { ...next } : {};
      cursor = cursor[part] as Values;
    }
  });
  return root as T;
}

/** Stable deep equality for plain JSON-like values — used for dirty tracking. */
export function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
