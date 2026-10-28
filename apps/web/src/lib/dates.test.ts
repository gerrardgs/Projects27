import assert from "node:assert/strict";
import { test } from "node:test";
import { monthBounds, today } from "./dates.ts";

test("today is computed in Asia/Jakarta, not the device's zone", () => {
  // 2026-10-27 18:30 UTC is already 2026-10-28 01:30 in Jakarta (UTC+7).
  assert.equal(today("Asia/Jakarta", new Date("2026-10-27T18:30:00Z")), "2026-10-28");
});

test("month bounds handle leap years", () => {
  assert.deepEqual(monthBounds("2028-02"), { year: 2028, month: 2, from: "2028-02-01", to: "2028-02-29" });
  assert.deepEqual(monthBounds("2026-10"), { year: 2026, month: 10, from: "2026-10-01", to: "2026-10-31" });
});
