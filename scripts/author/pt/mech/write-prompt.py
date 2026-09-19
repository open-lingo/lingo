#!/usr/bin/env python3
"""Narrow whole-spec writing prompt for one PT lesson (sentences + dialogue), from the spine or an m1 header file.
Usage: write-prompt.py (--spine pt-m2-3 | --header mech/headers/m1-l3.yaml) [--lang en|pt] [--cands cands.md --ncands 20] > prompt.md
No project context: the lesson row, the vocabulary walls, the exact rules the checker enforces, the output shape."""
import sys, re, yaml, argparse, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import spinelib as S
ap=argparse.ArgumentParser(); ap.add_argument('--spine'); ap.add_argument('--header'); ap.add_argument('--lang',default='en')
ap.add_argument('--cands'); ap.add_argument('--ncands',type=int,default=20); a=ap.parse_args()
if a.spine:
    h=dict(S.find(a.spine)); h['lessonId']=a.spine; _m,_l=S.parse_id(a.spine)
    header_block=f"lesson: {_l}\nid: pt-m{_m}-l{_l}\nspine: {a.spine}\n"
    if h.get('checkpoint'):
        _mw=S.module_words(h['moduleId'])
        header_block+=f"checkpoint: true\nwords: []\nrecall: [{', '.join(_mw)}]\n"
        _ff=h.get('false_friend')
        if _ff: header_block+=f"allowExtra: [{_ff['pt']}]\nreason: \"false-friend beat from the spine: {_ff['pt']} means {_ff['means']}, not {_ff['not']}\"\n"
        h['recall']=_mw
else:
    raw=yaml.safe_load(open(a.header,encoding='utf8')); h=S.header_from_spec(raw); header_block=open(a.header,encoding='utf8').read().rstrip()+"\n"
mod,les=S.parse_id(h['lessonId']); lid=f"pt-m{mod}-l{les}"
words=h.get('words') or []; recall=h.get('recall') or []; prior=S.prior_words(h['lessonId'])
checkpoint=bool(h.get('checkpoint'))
def wrow(w):
    g=f" ({w['gender']}.)" if w.get('gender') else ''; return f"{w['pt']} = {w.get('en','?')}{g} [{w.get('pos','')}]"
cs=h.get('contrastSet'); ap_=h.get('antiPattern') or (h.get('contrast') if isinstance(h.get('contrast'),dict) else None)
contrast_txt=''
if isinstance(h.get('contrast'),dict):
    c=h['contrast']; contrast_txt=f"CONTRAST to teach: right «{c['ok']}», wrong «{c['wrong']}» — {c.get('why','')}"
elif cs:
    contrast_txt="CONTRAST to teach: "+"; ".join(" vs ".join(x if isinstance(x,list) else x.get('set',[])) for x in cs)+" — "+(h.get('info') or '')
scene=h.get('scene') or {}; npc=scene.get('npc','Bia'); setting=scene.get('setting','')
win=h.get('win') or {}; cliff=h.get('cliffhanger','')
cands=''
if a.cands:
    rows=[l for l in open(a.cands,encoding='utf8') if l.startswith('- pmi')][:a.ncands]
    cands="\nSUGGESTED SENTENCES (corpus-checked; take any as-is, or write better ones of your own):\n"+"".join(re.sub(r'^- pmi \S+ lm \S+ \| \d+w \| ','- ',r) for r in rows)
ck=''
if checkpoint:
    mw=S.module_words(h['moduleId']); ff=h.get('false_friend')
    pairs=[[x['pt'] for x in S.lesson_words(S.find(l))][:2] for l in (h.get('contrasts') or [])]
    ck=f"""THIS IS THE MODULE CHECKPOINT: NO new words (the header already says words: [] and lists recall). Use only the module's words ({' '.join(mw)}) plus earlier vocabulary. Write 12 sentences that MIX the whole module (most sentences combine two lessons' words). Write `contrastSet:` with at least 3 entries, each a pair of forms the module contrasted (suggested pairs: {'; '.join(' / '.join(p) for p in pairs)}), each with its own why; for EVERY entry write two `cloze:` sentences, one per member (a cloze sentence contains the blanked form and may carry one more role). {('FALSE FRIEND: the header allows the extra word «'+ff['pt']+'» (it means '+ff['means']+', NOT '+ff['not']+'). Use it in exactly ONE sentence, gloss it correctly, and do not put it in uses:.') if ff else ''}
"""
en=f"""Write ONE Brazilian Portuguese beginner lesson as a YAML spec: the sentences and a 3-turn dialogue. Nothing else — no title, no word list, no commentary. Think it through carefully before you write: every rule below is checked by a machine and any miss is sent back.

LESSON {lid}: «{h.get('title','')}» — grammar point: {h.get('point') or h.get('grammar','')}
{('NEW WORDS (teach ALL of them; nothing else new): ' + ' | '.join(wrow(w) for w in words)) if words else ''}
RECALL WORDS to reuse: {' '.join(map(str,recall)) or '—'}
EARLIER VOCABULARY you may also use: {' '.join(map(str,prior))}
FUNCTION WORDS always allowed: {' '.join(sorted(S.CLOSED))} — plus names: {' '.join(S.CAST)}. ANY OTHER WORD IS FORBIDDEN (no oi, legal, hoje, ontem, bem, gente, casa… unless listed above). Contractions do/da/no/na are allowed ONLY if listed above, and only in a `cloze:`, never as build tiles.
{contrast_txt}
SCENE: {setting}; NPC = {npc}; learner = Sam. {('The lesson CLOSES on the win line «'+win.get('pt','')+'» = '+win.get('en','')+' — every word in it must be taught by your sentences; do not list it as a sentence.') if win else ''} {('Close the dialogue in the spirit of: '+cliff+' — but every NPC line stays inside the vocabulary walls and the correct option must answer it, so paraphrase, never quote words that are not allowed.') if cliff else ''}
{ck}
SENTENCE RULES
- 10–12 sentences, each ≤ 3 roles and AT MOST 18 roles in total across all sentences (each role becomes a step; the lesson has a 25-step ceiling), no two sentences identical, natural everyday Brazilian Portuguese a real person would say (short, concrete; questions get «?»; no textbook oddities like «Você tem uma família.»). Statements about «você» should be questions, not declaratives.
- Roles available: build, listen, speak, "cloze:<word>", debut. Fill: ≥3 build, ≥2 listen, ≥2 speak (mid-lesson lines), ≥1 question, and a `cloze:` on each contrasted form (the two forms of the lesson's verb / the article pair) — at least 2 cloze sentences.
- The FIRST sentence in your list that contains a NEW word carries `debut` (a sentence may debut two words). Every new word must appear in `uses:` of ≥ 3 sentences.
- A `build` sentence has ≥ 5 words unless it also carries `debut`.
- `uses:` = the NEW and RECALL words the sentence exercises, nothing else (never function words or names).
- Glosses (`en`) are natural English with the right article/plural/person; a verb gloss for an infinitive starts with "to".
- If the lesson has a two-form pair, add `contrastSet: [{{ set: [x, y], why: "one sentence, ≥ 25 chars, in your own words" }}]`. If the lesson ALSO teaches an article/determiner/pronoun pair (um/uma, o/a, meu/minha…), put a `cloze:` on each member too, and give every such cloze sentence its own `why: "…"` field (one sentence saying why that form is right there).
- Optional: one `agreement:` block (sentence with 2 blanks on article/adjective agreement, options both forms).
DIALOGUE RULES (3 turns with {npc}): turns 1 and 3 are choice turns with exactly 3 options; turn 2 is `mode: build`. Every NPC line asks Sam something or invites a reply (never a bare statement followed by an unrelated build goal). The correct option must ANSWER the NPC line and the goal; the two wrong options are things SAM could plausibly say (first person, grammatical, same length) that answer a DIFFERENT question or contradict the goal — never third-person statements about Bia/Rafael, never a question, never nonsense. Turns 1 and 3 must not ask the same thing. The build turn's `answer` has NO punctuation at all (no final stop, no commas) and answers the NPC line; every tile is ONE word (a chunk like por favor is two tiles); `tiles` = the answer's words + 2 wrong tiles. `gloss` and `goal` are English; `goal` ≤ 8 words. Sound like people talking. Every word in every NPC line, option and tile obeys the vocabulary walls above.
{cands}
OUTPUT: write the spec FILE. Never add title:, words:, win:, scene: or any key not shown below. Right after the header add one line `allow: [...]` listing every always-allowed function word you actually used (e.g. `allow: [e, não, com]`). It starts with this header, copied verbatim{' (it already has contrastSet — do not add another)' if h.get('contrastSet') else ''}:
{header_block}
then EXACTLY this shape (YAML, flow style as shown), nothing else:
sentences:
  - {{ pt: "Eu quero água.", en: "I want water.", roles: [build, debut], uses: [quero, água] }}
  - {{ pt: "Você quer café?", en: "Do you want coffee?", roles: ["cloze:quer", listen], uses: [quer, café] }}
  - {{ pt: "Quero uma água.", en: "I want a water.", roles: ["cloze:uma"], uses: [quero, água], why: "água is feminine, so it takes uma." }}
contrastSet: [{{ set: [quero, quer], why: "..." }}]
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
"""
if a.lang=='pt':
    en=en.replace("Write ONE Brazilian Portuguese beginner lesson as a YAML spec: the sentences and a 3-turn dialogue. Nothing else — no title, no word list, no commentary. Think it through carefully before you write: every rule below is checked by a machine and any miss is sent back.",
      "Escreva UMA lição de português brasileiro para iniciantes como um spec YAML: as frases e um diálogo de 3 turnos. Nada mais — sem título, sem lista de palavras, sem comentários. Pense com calma antes de escrever: cada regra abaixo é verificada por uma máquina e qualquer falha volta para você. As frases devem soar como um brasileiro fala de verdade; os glosses (`en`), `gloss` e `goal` ficam em inglês.")
print(en)
