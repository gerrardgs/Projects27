#!/usr/bin/env node
// Runs a command, or several npm scripts, and prints only what an agent or a person needs: one line per
// passing step, and the tail of the output for a failing one. The full output is always kept in a log file,
// so nothing is lost; it is just not pasted into a chat where every line costs tokens (rule 15 section 2).
//
// Usage (Node.js 22+, no dependencies):
//   node scripts/run-quiet.mjs [--lines 40] [--name <label>] -- <command> [args...]
//   node scripts/run-quiet.mjs [--lines 40] --steps check,test,lint      runs `npm run <step>` for each
// Prints "PASS <label> (<seconds>s)" or "FAIL <label> (exit <code>, <seconds>s)" with the last lines and the
// log path. Exit code: 0 when every step passed, otherwise the first failing step's code.
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const DEFAULT_LINES = 40;
// A warning marker at the start of a line ("warning:", "npm warn", "WARN", "⚠") or "warning:" anywhere;
// prose such as a test named "counts warnings" is not a warning
const WARNING = /^\s*(?:npm\s+)?(?:warn(?:ing)?\b|⚠)|\bwarning:/i;
// Built from the escape character's code so the pattern source holds no control character
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[A-Za-z]`, "g");

/** Removes ANSI colour and cursor codes so the tail is plain text. */
export function stripAnsi(text) {
  return text.replace(ANSI, "").replace(/\r(?!\n)/g, "\n");
}

function validate(options) {
  if (!Number.isInteger(options.lines) || options.lines < 1) throw new Error("--lines needs a positive whole number");
  if (options.steps.length === 0 && options.command.length === 0) {
    throw new Error("give a command after -- or npm scripts with --steps");
  }
  return options;
}

/** Parses the command line into options and the command to run. */
export function parseArgs(argv) {
  const options = { lines: DEFAULT_LINES, name: "", steps: [], command: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      options.command = argv.slice(index + 1);
      break;
    }
    if (arg === "--lines") options.lines = Number.parseInt(argv[++index], 10);
    else if (arg === "--name") options.name = argv[++index] ?? "";
    else if (arg === "--steps") options.steps = (argv[++index] ?? "").split(",").filter(Boolean);
    else throw new Error(`unknown option: ${arg}`);
  }
  return validate(options);
}

/** The text printed for one finished step. */
export function summarize({ label, code, seconds, output, logPath, lines = DEFAULT_LINES }) {
  const text = stripAnsi(output).replace(/\s+$/, "");
  const time = `${seconds.toFixed(1)}s`;
  if (code === 0) {
    const warnings = text.split("\n").filter((line) => WARNING.test(line)).length;
    return warnings
      ? `PASS ${label} (${time}, ${warnings} warning line(s); log: ${logPath})`
      : `PASS ${label} (${time})`;
  }
  const tail = text.split("\n").slice(-lines).join("\n");
  return `FAIL ${label} (exit ${code}, ${time}; full log: ${logPath})\n${tail}`;
}

/** Runs one command, keeps its combined output, and writes it to a log file. */
export function runStep(label, command, args) {
  return new Promise((resolve) => {
    const started = process.hrtime.bigint();
    const chunks = [];
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => chunks.push(chunk));
    // 'error' (command not found) is followed by 'close'; only the first one counts
    let settled = false;
    const finish = async (code, extra = "") => {
      if (settled) return;
      settled = true;
      const output = Buffer.concat(chunks).toString("utf8") + extra;
      const safeLabel = label.replace(/[^\w.-]+/g, "_").slice(0, 40);
      const logPath = path.join(tmpdir(), `run-quiet-${safeLabel}-${Date.now()}.log`);
      await writeFile(logPath, output);
      const seconds = Number(process.hrtime.bigint() - started) / 1e9;
      resolve({ label, code, seconds, output, logPath });
    };
    child.on("error", (error) => finish(127, `\n${error.message}`));
    child.on("close", (code, signal) => finish(code ?? (signal ? 128 : 1)));
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const steps = options.steps.length
    ? options.steps.map((step) => ({ label: step, command: npm, args: ["run", step] }))
    : [
        {
          label: options.name || options.command.join(" "),
          command: options.command[0],
          args: options.command.slice(1),
        },
      ];

  let exitCode = 0;
  for (const step of steps) {
    const result = await runStep(step.label, step.command, step.args);
    console.log(summarize({ ...result, lines: options.lines }));
    if (result.code !== 0 && exitCode === 0) exitCode = result.code;
  }
  process.exitCode = exitCode;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`run-quiet: ${error.message}`);
    process.exitCode = 2;
  });
}
