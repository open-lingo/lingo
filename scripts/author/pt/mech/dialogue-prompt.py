#!/usr/bin/env python3
"""Pass-3 prompt: the model writes ONLY the dialogue (3 turns) and the why line. Sentences are already arranged.
Usage: dialogue-prompt.py <arranged.body.yaml> <l3|l5> [en|pt] > prompt.md"""
import sys, re
body=open(sys.argv[1]).read(); key=sys.argv[2]; lang=sys.argv[3] if len(sys.argv)>3 else 'en'
sents=re.findall(r'pt: "(.+?)", en: "(.+?)"', body)
SCENE={"l3":("Rafael shows Sam his flat and introduces his family", "Rafael", "Rafael asks whether Sam has a sister; end on Rafael inviting Sam to meet his sister tomorrow — using only words from the sentences"),
       "l5":("Saturday afternoon with Bia, talking about what they like", "Bia", "end on Bia asking what Sam likes to do")}
CONTRAST={"l3":"tenho = I have; tem = you have / he, she has (and um before masculine nouns, uma before feminine)",
          "l5":"gostar always takes de before a noun or a verb («gosto de comer», never «gosto comer»)"}
setting,npc,cliff=SCENE[key]
vocab=sorted({w for s,_ in sents for w in re.findall(r"[A-Za-záàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]+", s)}, key=str.lower)
if lang=='en':
    head=f"""Write a 3-turn Brazilian Portuguese dialogue for a beginner lesson, plus one explanation line. Nothing else.
Scene: {setting}. NPC: {npc}. Learner: Sam. {cliff}.
VOCABULARY YOU MAY USE (every word of every line, NPC and options alike): {' '.join(vocab)} — plus: e, mas, não, sim, também, oi, legal, obrigado, obrigada.
RULES: turn 1 and 3 are choice turns with exactly 3 options; turn 2 is `mode: build`. In a choice turn the correct option must ANSWER the NPC line and the goal; the two wrong options must be grammatical, same length, and clearly NOT answer it (wrong person, wrong thing asked, or a non-sequitur a beginner would recognise). The build turn's `answer` has no final punctuation and must answer the NPC line; `tiles` = the answer's words + 2 wrong tiles. `gloss` and `goal` are English. Sound like people talking, not a drill.
why: one English sentence, in your own words, that teaches: {CONTRAST[key]}.
THE LESSON'S SENTENCES (for reference — the dialogue may reuse or recombine them):
""" + "\n".join(f"- {s} — {e}" for s,e in sents)
else:
    head=f"""Escreva um diálogo de 3 turnos em português brasileiro para uma lição de iniciante, mais uma linha de explicação. Nada mais.
Cena: {setting}. Personagem: {npc}. Aluno: Sam. {cliff}.
VOCABULÁRIO PERMITIDO (toda palavra de toda fala, do personagem e das opções): {' '.join(vocab)} — mais: e, mas, não, sim, também, oi, legal, obrigado, obrigada.
REGRAS: turnos 1 e 3 são de escolha com exatamente 3 opções; o turno 2 é `mode: build`. Num turno de escolha a opção certa tem de RESPONDER à fala do personagem e ao goal; as duas erradas têm de ser gramaticais, do mesmo tamanho, e claramente NÃO responder (pessoa errada, coisa errada, ou um non sequitur que um iniciante reconheça). No turno build, `answer` sem pontuação final e respondendo à fala; `tiles` = as palavras da resposta + 2 peças erradas. `gloss` e `goal` em inglês. Soe como gente conversando, não como exercício.
why: uma frase em INGLÊS, com suas palavras, que ensine: {CONTRAST[key]}.
AS FRASES DA LIÇÃO (referência — o diálogo pode reutilizar ou recombinar):
""" + "\n".join(f"- {s} — {e}" for s,e in sents)
shape=f"""

OUTPUT EXACTLY (YAML):
why: "..."
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
print(head+shape)
