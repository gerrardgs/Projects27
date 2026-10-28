// Errors that map to RFC 9457 problem details. Anything else becomes a generic 500.

export class HttpError extends Error {
  readonly status: number;
  readonly title: string;
  readonly fields: Record<string, string> | undefined;

  constructor(status: number, title: string, detail: string, fields?: Record<string, string>) {
    super(detail);
    this.status = status;
    this.title = title;
    this.fields = fields;
  }
}

export const badRequest = (detail: string, fields?: Record<string, string>) =>
  new HttpError(400, "Invalid request", detail, fields);
export const unauthorized = (detail = "Sign in to continue.") => new HttpError(401, "Unauthorized", detail);
export const forbidden = (detail = "You do not have permission for this action.") =>
  new HttpError(403, "Forbidden", detail);
export const notFound = (detail = "Not found.") => new HttpError(404, "Not found", detail);
export const conflict = (detail: string) => new HttpError(409, "Conflict", detail);
export const unprocessable = (detail: string) => new HttpError(422, "Rule violated", detail);
export const tooMany = (detail = "Too many attempts; try again later.") =>
  new HttpError(429, "Too many requests", detail);
