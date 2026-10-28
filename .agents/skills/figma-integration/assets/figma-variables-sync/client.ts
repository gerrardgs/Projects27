// Minimal client for GET /v1/files/:file_key/variables/local.
// Requirements (Figma docs, checked 2026-10-15): a Full seat in an Enterprise organisation, and a token with the
// file_variables:read scope. Personal access tokens go in the X-Figma-Token header.
import type { GetLocalVariablesResponse } from "@figma/rest-api-spec";

export const FIGMA_API = "https://api.figma.com";
const TIMEOUT_MS = 30_000;

export class FigmaApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "FigmaApiError";
    this.status = status;
  }
}

/** Explains the most common failures without echoing the token or the raw response body. */
function describeFailure(status: number, retryAfter: string | null): string {
  switch (status) {
    case 400:
      return "bad request: check the file key";
    case 401:
    case 403:
      return "not authorised: the token needs the file_variables:read scope, and the Variables API is limited to Full seats in Enterprise organisations";
    case 404:
      return "file not found, or the token's owner cannot open it";
    case 429:
      return `rate limited by Figma${retryAfter === null ? "" : `; retry after ${retryAfter} seconds`}`;
    default:
      return `unexpected response from Figma (HTTP ${status})`;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const RESOLVED_TYPES: ReadonlySet<unknown> = new Set(["BOOLEAN", "FLOAT", "STRING", "COLOR"]);

function checkVariable(id: string, value: unknown): string | null {
  if (!isRecord(value)) return `variable ${id} is not an object`;
  const { name, variableCollectionId, resolvedType, valuesByMode, scopes, codeSyntax, description } = value;
  if (typeof name !== "string" || typeof variableCollectionId !== "string")
    return `variable ${id} lacks name or collection`;
  if (!RESOLVED_TYPES.has(resolvedType)) return `variable ${id} has unknown resolvedType`;
  if (!isRecord(valuesByMode) || !Array.isArray(scopes) || !isRecord(codeSyntax) || typeof description !== "string") {
    return `variable ${id} lacks valuesByMode, scopes, codeSyntax or description`;
  }
  return null;
}

function checkCollection(id: string, value: unknown): string | null {
  if (!isRecord(value)) return `collection ${id} is not an object`;
  const { name, modes, defaultModeId, variableIds } = value;
  if (typeof name !== "string" || typeof defaultModeId !== "string")
    return `collection ${id} lacks name or defaultModeId`;
  if (!Array.isArray(modes) || !modes.every((mode) => isRecord(mode) && typeof mode.modeId === "string")) {
    return `collection ${id} has invalid modes`;
  }
  return Array.isArray(variableIds) ? null : `collection ${id} lacks variableIds`;
}

/**
 * Validates untrusted JSON (an API response or a saved file) before conversion. Checks every field that
 * convert.ts reads, and throws with the first problem instead of letting a malformed file fail later.
 */
export function parseVariablesResponse(body: unknown): GetLocalVariablesResponse {
  if (!isRecord(body) || !isRecord(body.meta)) throw new Error("not a variables response: missing meta");
  const { variables, variableCollections } = body.meta;
  if (!isRecord(variables) || !isRecord(variableCollections)) {
    throw new Error("not a variables response: missing meta.variables or meta.variableCollections");
  }
  const problems = [
    ...Object.entries(variables).map(([id, value]) => checkVariable(id, value)),
    ...Object.entries(variableCollections).map(([id, value]) => checkCollection(id, value)),
  ].filter((problem): problem is string => problem !== null);
  if (problems.length > 0) throw new Error(`invalid variables response: ${problems[0]}`);
  // Every field convert.ts reads was checked above; the remaining fields are passed through untouched.
  return body as GetLocalVariablesResponse;
}

export async function fetchLocalVariables(
  fileKey: string,
  token: string,
  options: { readonly baseUrl?: string; readonly signal?: AbortSignal } = {},
): Promise<GetLocalVariablesResponse> {
  if (!/^[A-Za-z0-9]+$/.test(fileKey)) throw new Error("file key may contain only letters and digits");
  if (token.trim() === "") throw new Error("FIGMA_TOKEN is empty");
  const url = new URL(`/v1/files/${fileKey}/variables/local`, options.baseUrl ?? FIGMA_API);
  const response = await fetch(url, {
    headers: { "X-Figma-Token": token, accept: "application/json" },
    signal: options.signal ?? AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new FigmaApiError(response.status, describeFailure(response.status, response.headers.get("retry-after")));
  }
  return parseVariablesResponse(await response.json());
}
