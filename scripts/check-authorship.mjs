#!/usr/bin/env node
// Fails when a commit credits an AI agent: an AI author or committer identity, an AI co-author or sign-off trailer,
// or a "Generated with <AI tool>" line. GitHub lists co-authors as contributors, so one such trailer is enough to
// show an AI agent next to the human author (rule 08 section 2). Mentions of AI tools in the subject or body
// (for example "Claude Design" as a topic) are not attribution and are not flagged; neither is Dependabot.
//
// Usage (Node.js 22+, no dependencies, run inside a git repository):
//   node scripts/check-authorship.mjs                 every commit reachable from HEAD
//   node scripts/check-authorship.mjs origin/main..   only the commits a branch adds
// Exit code 1 when any commit credits an AI agent.
import { execFileSync } from "node:child_process";

// Names, products and bot accounts of AI coding agents; matched as whole words, case-insensitive.
const AI_NAME =
  /\b(claude|anthropic|openai|chatgpt|gpt-?\d|codex|copilot|gemini|google-labs-jules|jules\[bot\]|cursor ?agent|cursoragent|devin[ -]ai|devin-ai-integration|windsurf|codeium|aider|amazon q|codewhisperer|tabnine|sweep-ai|openhands|all-hands|lovable|bolt\.new|v0\[bot\])\b/i;
// Email domains used by AI agents for their commits and trailers.
const AI_EMAIL_DOMAIN =
  /@(anthropic\.com|openai\.com|cursor\.com|devin\.ai|all-hands\.dev|aider\.chat|codeium\.com|windsurf\.com)>?$/i;
const TRAILER = /^(co-authored-by|signed-off-by|assisted-by|generated-by|helped-by|reviewed-by)\s*:\s*(.+)$/i;
const GENERATED_LINE = /^\W*(generated|created|written|made)\s+(with|by|using)\b(.*)$/i;

const isAi = (text) => AI_NAME.test(text) || AI_EMAIL_DOMAIN.test(text.trim());

/** Problems in one commit: { hash, name, email, committerName, committerEmail, message }. */
export function findAiAttribution(commit) {
  const problems = [];
  if (isAi(`${commit.name} <${commit.email}>`))
    problems.push(`author is an AI agent: ${commit.name} <${commit.email}>`);
  if (isAi(`${commit.committerName} <${commit.committerEmail}>`)) {
    problems.push(`committer is an AI agent: ${commit.committerName} <${commit.committerEmail}>`);
  }
  for (const line of commit.message.split("\n")) {
    const trailer = TRAILER.exec(line.trim());
    if (trailer && isAi(trailer[2])) problems.push(`AI ${trailer[1].toLowerCase()} trailer: ${line.trim()}`);
    const generated = GENERATED_LINE.exec(line.trim());
    if (generated && isAi(generated[3])) problems.push(`AI attribution line: ${line.trim()}`);
  }
  return problems;
}

/** Commits from `git log`, separated with control characters so messages can contain anything. */
export function readCommits(range = "HEAD", cwd = process.cwd()) {
  const output = execFileSync("git", ["log", "--format=%H%x1f%an%x1f%ae%x1f%cn%x1f%ce%x1f%B%x1e", range], {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return output
    .split("\x1e")
    .map((record) => record.replace(/^\n/, ""))
    .filter(Boolean)
    .map((record) => {
      const [hash, name, email, committerName, committerEmail, message] = record.split("\x1f");
      return { hash, name, email, committerName, committerEmail, message };
    });
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const range = process.argv[2] || "HEAD";
  const commits = readCommits(range);
  let failures = 0;
  for (const commit of commits) {
    for (const problem of findAiAttribution(commit)) {
      failures += 1;
      console.error(`error: ${commit.hash.slice(0, 7)} ${problem}`);
    }
  }
  console.log(`${commits.length} commit(s) checked, ${failures} AI attribution(s) found`);
  if (failures) {
    console.error(
      "Commits must carry only the human author. Amend the message to drop the line (the tree stays identical), " +
        "and force-push with --force-with-lease only with the owner's approval (rule 08 sections 2 and 3).",
    );
    process.exit(1);
  }
}
