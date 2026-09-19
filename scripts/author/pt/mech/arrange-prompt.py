#!/usr/bin/env python3
"""Assemble the MINIMAL arranging prompt for one lesson: scored candidates + a roles checklist + a 15-line output
example + two lines of scene. No project context. Usage: arrange-prompt.py <l3|l5> <cands.md> > prompt.md"""
import sys
key, cands = sys.argv[1], open(sys.argv[2]).read()
SCENE={"l3":("Rafael introduces his family to Sam at his flat","Rafael","«Você tem uma irmã?» — Sam answers, then Rafael: «Legal! Amanhã a gente vai comer pizza.»"),
       "l5":("Saturday with Bia, talking about what they like","Bia","end on Bia asking what Sam likes to do on Sunday")}
CONTRAST={"l3":"[tenho, tem] and [um, uma] — why: tenho = I have, tem = you have / he, she has; um before masculine nouns, uma before feminine",
          "l5":"[gosto, gosta] and the de after gostar — why: gostar always takes de before a noun or a verb («gosto de comer», never «gosto comer»)"}
setting, npc, cliff = SCENE[key]
print(f"""You arrange a Brazilian Portuguese lesson from sentences that are ALREADY written and scored. Do not invent sentences.
Pick from the lists below. ACCEPT rows are safe. Take a JUDGE row only if a Brazilian would say it, and add `# judge: <why>`.

FILL THESE ROLES (one sentence may carry two roles; 8–10 sentences total):
- 2 × [build] statements   - 2 × [listen] statements   - 1 × [speak, debut] short statement
- 2 × ["cloze:<word>"] on the contrast words {CONTRAST[key].split(' — ')[0]}   - 1 × question (roles [listen])
- 1 × [speak] win line: the most useful sentence of the lesson, positive, first person
Glosses: copy the English from the list; fix only wrong English (tense, article).
Then write `dialogue:` — 3 turns with {npc}. Scene: {setting}. Every NPC line and every option is built ONLY from words that appear
in the lists (recombine freely, change person). ≥3 options per choice turn, one turn `mode: build`. Wrong options must be plausible
(same length, real words) — never nonsense. {cliff}
Write `why:` for the contrast: {CONTRAST[key].split(' — why: ')[1]} — one sentence in your own words.

OUTPUT EXACTLY THIS SHAPE (YAML), nothing else — no title, no word list, no explanations:
sentences:
  - {{ pt: "Eu tenho um amigo.", en: "I have a friend.", roles: [build], uses: [tenho, amigo] }}
  - {{ pt: "Você tem uma irmã?", en: "Do you have a sister?", roles: ["cloze:tem", listen], uses: [tem, irmã] }}
win: {{ pt: "...", en: "..." }}
why: "one sentence explaining the contrast"
dialogue:
  npc: {npc}
  turns:
    - npc: "..."
      gloss: "..."
      goal: "..."
      options: ["...", "...", "..."]
      correct: 0
    - npc: "..."
      gloss: "..."
      goal: "Build: ..."
      mode: build
      tiles: ["...", "...", "...", "...", "..."]
      answer: "..."
    - npc: "..."
      gloss: "..."
      goal: "..."
      options: ["...", "...", "..."]
      correct: 0

`uses:` lists the lesson words the sentence exercises (from: tenho tem um uma família irmã amigo gato / gosto gosta falar comer assistir filme música pizza).

CANDIDATES:
{cands}""")
