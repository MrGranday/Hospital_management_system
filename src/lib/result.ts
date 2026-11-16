export type ResultError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ResultError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  code: string,
  message: string,
  fields?: Record<string, string>,
): Result<T> {
  return { ok: false, error: { code, message, fields } };
}
