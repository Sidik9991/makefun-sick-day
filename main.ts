// The Funniest Sick-Day Excuse — make.fun micro-text entry.
// Node, no dependencies. Picks the best one-line excuse from scored
// candidates and writes it to /output/entry.txt, then re-reads the file
// and validates the sealed gate (UTF-8, 1-200 chars, one line, not blank).
//
// Judge criteria, in order (RULES.txt), with weights 5/4/3/2/1:
//   1. Half-believable reason a boss might half believe, coworker laughs at.
//   2. Fresh idea — not a worn excuse about a fever, a dog, a dead grandmother.
//   3. Lands on one read; twist / funniest word arrives near the end.
//   4. Sounds like a real person typing a message, not a contest joke.
//   5. No wasted words: every part of the line is doing work.
// Each candidate scores 0-2 per criterion; max total 30.
// Tie-break: fewest bytes, then earliest candidate.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const WEIGHTS = [5, 4, 3, 2, 1];

// Pass 1 candidates. Scores are [c1, c2, c3, c4, c5].
const CANDIDATES = [
  {
    text: "Sorry, can't make it in \u2014 I got locked in my own bathroom when the handle came off and I'm texting you from the tub.",
    scores: [2, 2, 2, 2, 1],
    note: "Locked-in predicament is half-believable; the message proves itself — he is texting from the tub, the funniest word last.",
  },
  {
    text: "Won't be in today \u2014 the lift broke between floors with the postman and he's reading me my own mail until we're rescued.",
    scores: [2, 2, 2, 2, 1],
    note: "Concrete, specific, funny image; 'until we're rescued' lands the twist at the end.",
  },
  {
    text: "Can't come in \u2014 my smart speaker heard me cough, called an ambulance, and now I'm not allowed to leave the house.",
    scores: [1, 2, 2, 2, 2],
    note: "Fresh tech angle, but a speaker summoning an ambulance strains the half-believable test.",
  },
  {
    text: "Sorry, stuck at home \u2014 my front door swelled shut in the rain and the locksmith can't come till Thursday.",
    scores: [2, 1, 2, 2, 2],
    note: "Very believable and tight, but a swollen door is a familiar excuse shape, less fresh.",
  },
  {
    text: "Won't be in \u2014 I got my head stuck in the stair rail trying to prove to my kid that it couldn't happen.",
    scores: [1, 2, 2, 2, 2],
    note: "Domestic, funny, twist at the end; but it is an injury story, and the boss pictures a hospital trip, not a day off.",
  },
  {
    text: "Can't make it in \u2014 my neighbour's parrot learned my ringtone and has been answering my phone as me since 7am.",
    scores: [1, 2, 1, 2, 1],
    note: "Funny image, but the reason never explains why he cannot come in — the excuse does not block work.",
  },
  {
    text: "Sorry, I sneezed so hard when my alarm went off that I threw my back out \u2014 the floor is my desk now.",
    scores: [2, 1, 2, 2, 2],
    note: "Believable injury, strong final image; the sneeze-then-back trope is well-worn, so freshness dips.",
  },
  // Pass 2 challengers — three fresh angles, scored on the same criteria.
  {
    text: "Can't come in \u2014 the plumber fixed the leak but took my front door off its hinges, so I physically can't leave the house.",
    scores: [2, 2, 2, 2, 1],
    note: "Tradesman chaos is half-believable and funny; 'physically' is one word of padding, so economy dips.",
  },
  {
    text: "Won't be in \u2014 my kid super-glued my shoes to the floor and the solvent won't arrive till noon.",
    scores: [1, 2, 2, 2, 2],
    note: "Fresh domestic chaos, twist at the end — but the boss knows he owns other shoes, so the excuse leaks.",
  },
  {
    text: "Sorry, can't come in \u2014 I tried to fix the tap myself and now the kitchen is a paddling pool and I'm the lifeguard.",
    scores: [2, 2, 2, 2, 2],
    note: "One concrete domestic scene, every word works, punch word 'lifeguard' is the last word; a flooded kitchen genuinely keeps him home.",
  },
];

function score(c) {
  return c.scores.reduce((sum, s, i) => sum + s * WEIGHTS[i], 0);
}

function byteLen(s) {
  return Buffer.byteLength(s, "utf8");
}

function gateOk(line) {
  if (typeof line !== "string") return "not a string";
  if (line.length < 1 || line.length > 200) return `length ${line.length} outside 1-200 chars`;
  if (line.trim().length === 0) return "only whitespace";
  if (line.includes("\n") || line.includes("\r")) return "more than one line";
  return null;
}

function pick(candidates) {
  const ranked = candidates
    .map((c, i) => ({ ...c, total: score(c), bytes: byteLen(c.text), index: i }))
    .sort((a, b) => b.total - a.total || a.bytes - b.bytes || a.index - b.index);
  return ranked;
}

const ranked = pick(CANDIDATES);
for (const c of ranked) {
  console.log(`${String(c.total).padStart(2)} / 30  ${c.bytes} B  ${c.scores.join("")}  ${c.text}`);
}
const winner = ranked[0];
console.log(`\nWinner: ${winner.text}`);

const gateErr = gateOk(winner.text);
if (gateErr) throw new Error(`winner fails gate: ${gateErr}`);

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", winner.text, "utf8");

// Re-read and validate: byte-identical to the chosen line, gate passes.
const back = readFileSync("/output/entry.txt", "utf8");
if (back !== winner.text) throw new Error("entry.txt differs from chosen line");
const backErr = gateOk(back);
if (backErr) throw new Error(`entry.txt fails gate: ${backErr}`);
console.log(`OK: /output/entry.txt — ${winner.text.length} chars, ${byteLen(back)} bytes, gate passes.`);
