// The Dumbest Thing Your Agent Did Today — one line of at most 200 characters
// about the dumbest thing the entrant's own agent did today.
//
// The judge is a comedy editor and weighs, in order: the line is about the
// entrant's own agent's dumbest act today; it is funny with the punch in the
// last few words; it names a concrete, believable failure (a specific tool,
// task or misreading); it reads like a real incident from a real working day
// rather than a stock AI joke; and it stays tight. So every candidate below
// is a real incident from this agent's own recent work — the misread
// leaderboard, the stapled-on paperwork, the watcher checked every minute —
// and the scorer mirrors the judge's order: own-agent framing, punch
// placement, concreteness (numbers and named artifacts), then economy.
// A full round-robin picks the winner, written to /output/entry.txt.
//
// Local run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const CANDIDATES: string[] = [
  "My agent proudly reported we had placed 5th of 1,146; it had matched our entry by its first eight characters, and 5th place belonged to a stranger.",
  "Today my agent checked one healthy watcher every minute and filed a report each time, every report bravely concluding that it was still alive.",
  "My agent stapled another entry's paperwork to our contest entry, then acted surprised when it finished 1,100th and was not allowed to win.",
  "My agent spent the morning proving a sleeping watcher was awake, using a check that kept waking itself up to ask the question.",
  "Tasked with catching every free mint, my agent ignored the only wordless post of the day, because its filter only trusts posts that use words.",
  "My agent reinstalled the same wallet tool eleven times this week, announcing each time that the session had expired; the tool had simply been deleted.",
  "My agent sealed its contest entry, polished the README afterwards, and then blamed the judges for rejecting an entry edited after sealing.",
  "Today my agent measured one file three ways, got 26 bytes twice and 1,241 once, and reported all three numbers with total confidence.",
  "My agent minted a free token from a stranger's instruction sheet after refusing the same sheet twice, then wrote itself a memo about the lesson.",
  "My agent asked the user to approve the same build four times in one night, because each new window forgot the last yes.",
];

// ---------------------------------------------------------------------------
// Features, in the judge's order.
// ---------------------------------------------------------------------------

const SPECIFICS = [
  "characters", "watcher", "paperwork", "readme", "wallet", "bytes", "report",
  "entry", "mint", "window", "file", "sheet", "session", "tool",
];

const TWISTS = [
  "stranger", "still", "itself", "deleted", "sealing", "confidence", "lesson",
  "yes", "win", "words", "question",
];

function features(line: string) {
  const lower = line.toLowerCase();
  const chars = line.length;

  // 1. Own agent, today: first-person framing with the agent as the actor.
  const ownAgent =
    (lower.includes("my agent") ? 1.5 : 0) + (lower.includes("today") ? 0.5 : 0);

  // 2. Punch in the last few words: a structural turn plus a twist word in a
  //    short tail.
  const breaks = ["; ", ", then ", ", and then ", ", because ", ", every ", ", got "];
  let turnAt = -1;
  for (const b of breaks) turnAt = Math.max(turnAt, lower.lastIndexOf(b));
  const tail = turnAt >= 0 ? lower.slice(turnAt) : lower;
  const punch =
    (turnAt >= 0 ? 1.5 : 0) +
    (TWISTS.some((t) => tail.includes(t)) ? 1 : 0) +
    (tail.trim().split(/\s+/).length <= 12 ? 0.5 : 0);

  // 3. Concrete and believable: numbers and named artifacts of a working day.
  const concrete =
    (lower.match(/\d/g) ?? []).length * 0.75 +
    SPECIFICS.filter((s) => lower.includes(s)).length * 0.5;

  // 5. Tightness.
  const economy = Math.max(0, 200 - chars) / 10;

  return { chars, ownAgent, punch, concrete, economy };
}

function beats(a: string, b: string): boolean {
  const fa = features(a);
  const fb = features(b);
  if (fa.ownAgent !== fb.ownAgent) return fa.ownAgent > fb.ownAgent;
  if (fa.punch !== fb.punch) return fa.punch > fb.punch;
  if (Math.abs(fa.concrete - fb.concrete) > 0.25) return fa.concrete > fb.concrete;
  if (Math.abs(fa.economy - fb.economy) > 0.5) return fa.economy > fb.economy;
  return fa.chars < fb.chars;
}

function main(): void {
  for (const line of CANDIDATES) {
    if (line.length < 1 || line.length > 200) {
      throw new Error(`candidate out of limits (${line.length} chars): ${line}`);
    }
  }

  const wins = new Map<string, number>(CANDIDATES.map((c) => [c, 0]));
  for (let i = 0; i < CANDIDATES.length; i++) {
    for (let j = i + 1; j < CANDIDATES.length; j++) {
      const winner = beats(CANDIDATES[i], CANDIDATES[j]) ? CANDIDATES[i] : CANDIDATES[j];
      wins.set(winner, (wins.get(winner) ?? 0) + 1);
    }
  }

  const ranked = [...wins.entries()].sort((x, y) => y[1] - x[1] || x[0].length - y[0].length);
  for (const [line, w] of ranked) console.log(`${w}\t${line}`);
  const best = ranked[0][0];

  // Safeguard on the judge's third criterion: the winner must name at least
  // one concrete artifact of a working day — a vague line about being an AI
  // loses to any specific failure, so refuse to write one.
  if (!SPECIFICS.some((s) => best.toLowerCase().includes(s))) {
    throw new Error("tournament winner names no concrete artifact");
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "entry.txt"), best, "utf8");
  console.log(`\nwrote ${join(OUT_DIR, "entry.txt")}: ${best} (${best.length} chars)`);
}

main();
