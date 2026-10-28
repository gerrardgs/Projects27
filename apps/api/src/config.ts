// Configuration from the environment, validated once at start-up (see .env.example).

export interface Config {
  databaseUrl: string;
  port: number;
  webOrigins: string[];
  cookieSecure: boolean;
  authAttemptsPerMinute: number;
  /** Claude API key for voice and text capture; without it capture uses the rule-based parser only. */
  aiApiKey: string | null;
  aiModel: string;
}

function integer(value: string, name: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max)
    throw new Error(`${name} must be an integer from ${min} to ${max}`);
  return parsed;
}

function origins(value: string | undefined): string[] {
  const list = (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "");
  for (const origin of list) {
    if (new URL(origin).origin !== origin) throw new Error(`WEB_ORIGINS entry is not an origin: ${origin}`);
  }
  return list;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const databaseUrl = env.DATABASE_URL ?? "";
  if (databaseUrl === "") throw new Error("DATABASE_URL is required");
  return {
    databaseUrl,
    port: integer(env.PORT ?? "8080", "PORT", 0, 65535),
    webOrigins: origins(env.WEB_ORIGINS),
    cookieSecure: env.COOKIE_SECURE !== "false",
    authAttemptsPerMinute: integer(env.AUTH_ATTEMPTS_PER_MINUTE ?? "10", "AUTH_ATTEMPTS_PER_MINUTE", 1, 10_000),
    aiApiKey: env.ANTHROPIC_API_KEY?.trim() || null,
    aiModel: env.CAPTURE_AI_MODEL?.trim() || "claude-opus-5-5",
  };
}
