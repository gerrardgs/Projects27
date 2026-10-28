// Loads the shared sample ledger and posts it through the public API, as any client would.

import { readFileSync } from "node:fs";
import { accountIds, api, type Entry, type Harness } from "./helpers.ts";

interface FixtureLine {
  account: string;
  debit?: string;
  credit?: string;
}

type FixtureEntry =
  | { type: "journal"; date: string; description: string; lines: FixtureLine[] }
  | {
      type: "transaction";
      kind: string;
      date: string;
      description: string;
      account: string;
      funding: string;
      amount: string;
    };

export interface Fixture {
  entries: FixtureEntry[];
  expected: {
    monthlyRecap: Record<string, unknown> & { income: { code: string }[]; expenses: { code: string }[] };
    balanceSheet: Record<string, unknown>;
    trialBalance: {
      asOf: string;
      totalDebit: string;
      totalCredit: string;
      lines: { code: string; debit: string; credit: string }[];
    };
  };
}

export const fixture = JSON.parse(
  readFileSync(new URL("../../../packages/contract/fixtures/personal-sample.json", import.meta.url), "utf8"),
) as Fixture;

export async function postFixture(h: Harness, token: string, entityId: string): Promise<Entry[]> {
  const ids = await accountIds(h, token, entityId);
  const id = (code: string) => {
    const found = ids.get(code);
    if (found === undefined) throw new Error(`fixture account ${code} missing`);
    return found;
  };
  const posted: Entry[] = [];
  for (const [index, entry] of fixture.entries.entries()) {
    const res =
      entry.type === "journal"
        ? await api<Entry>(h, "POST", `/v1/entities/${entityId}/journal-entries`, {
            token,
            body: {
              date: entry.date,
              description: entry.description,
              idempotencyKey: `fixture-${index}`,
              lines: entry.lines.map((l) => ({
                accountId: id(l.account),
                ...(l.debit ? { debit: l.debit } : { credit: l.credit }),
              })),
            },
          })
        : await api<Entry>(h, "POST", `/v1/entities/${entityId}/transactions`, {
            token,
            body: {
              kind: entry.kind,
              date: entry.date,
              description: entry.description,
              accountId: id(entry.account),
              fundingAccountId: id(entry.funding),
              amount: entry.amount,
              idempotencyKey: `fixture-${index}`,
            },
          });
    if (res.status !== 201) throw new Error(`fixture entry ${index} failed: ${res.status} ${JSON.stringify(res.body)}`);
    posted.push(res.body);
  }
  return posted;
}
