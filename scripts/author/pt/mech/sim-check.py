#!/usr/bin/env python3
"""Mechanical sanity for a model-written dialogue: every word inside the allowed vocabulary; in a choice turn exactly one
option shares a content word with the NPC line or goal (the keyed one); build answer shares a content word with the NPC
line/goal and its words ⊆ tiles. Usage: sim-check.py <out.yaml> <prompt.md>  → prints findings, exit 1 on any hard finding."""
import sys, re, yaml
out=open(sys.argv[1]).read(); prompt=open(sys.argv[2]).read()
TOK=re.compile(r"[A-Za-záàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]+")
if '--spec' in sys.argv:   # vocabulary from the spec's own header/spine (lint-equivalent walls)
    import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import spinelib as S
    _sp=yaml.safe_load(prompt); vocab=S.allowed_tokens(S.header_from_spec(_sp))|{n.lower() for n in S.CAST}|{'oi','legal'}
else:
    m=re.search(r'(?:VOCABULARY YOU MAY USE|VOCABULÁRIO PERMITIDO)[^:]*: (.+?) — (?:plus|mais): (.+?)\n', prompt)
    vocab={w.lower() for w in TOK.findall(m.group(1))}|{w.lower() for w in TOK.findall(m.group(2))}|{'sam','rafael','bia','pedro'}
FUNC=set("e ou mas não sim com a o um uma de do da em no na eu você ele ela também só oi legal obrigado obrigada".split())
try: d=yaml.safe_load(out)
except Exception as e: print("HARD yaml:", str(e)[:80]); sys.exit(1)
hard=0
_plural_ok=('os' in vocab and 'as' in vocab)
def _known(t):
    if t in vocab: return True
    if not _plural_ok: return False
    return any(x in vocab for x in (re.sub(r's$','',t), re.sub(r'ões$','ão',t), re.sub(r'ães$','ão',t), re.sub(r'is$','l',t), re.sub(r'ns$','m',t), re.sub(r'es$','',t)) if x!=t)
turns=(d.get('dialogue') or {}).get('turns') or []
if len(turns)!=3: print(f"HARD turns={len(turns)}"); hard+=1
def content(s): return {w.lower() for w in TOK.findall(s)}-FUNC
for i,t in enumerate(turns,1):
    lines=[t.get('npc','')]+list(t.get('options') or [])+[t.get('answer','')]+list(t.get('tiles') or [])
    bad={w.lower() for s in lines for w in TOK.findall(s) if not _known(w.lower())}
    if bad: print(f"HARD t{i} untaught: {sorted(bad)}"); hard+=1
    if len((t.get('goal') or '').split())>8: print(f"HARD t{i} goal > 8 words"); hard+=1
    for s_ in lines:
        if re.search(r'\bgost\w+ de [^,]+, não (?!de\b|gost)', s_.lower()): print(f"HARD t{i} dropped «de» after não: {s_}"); hard+=1
    ctx=content(t.get('npc',''))|content(t.get('goal',''))
    if t.get('mode')=='build':
        ans=t.get('answer',''); tiles=t.get('tiles') or []
        if ans.endswith(('.', '!', '?')): print(f"HARD t{i} answer has final punctuation"); hard+=1
        if not set(ans.split())<=set(tiles): print(f"HARD t{i} answer words not all in tiles"); hard+=1
        if not content(ans)&ctx: print(f"SOFT t{i} build answer shares no content word with NPC/goal")
    else:
        opts=t.get('options') or []; k=t.get('correct',0)
        if len(opts)!=3: print(f"HARD t{i} options={len(opts)}"); hard+=1
        npc=t.get('npc','').lower(); asks_you='você' in npc.split() or 'you' in t.get('goal','').lower()
        def responds(o):
            first=o.split()[0].lower().strip(',') if o.split() else ''
            if first in ('sim','não') and len(o.split())>1: first=o.split()[1].lower()
            third=first in ('bia','pedro','rafael','ele','ela')
            return bool(content(o)&ctx) and not (asks_you and third)      # a third-person line does not answer "do you…?"
        resp=[j for j,o in enumerate(opts) if responds(o)]
        if k not in resp: print(f"SOFT t{i} keyed option shares no content word with NPC/goal")
        if len(resp)>1: print(f"SOFT t{i} ambiguous: options {resp} all respond")
why=d.get('why','') or ''
if not why and d.get('contrastSet'):   # a spec carries its why inside contrastSet entries
    why=' '.join(str(c.get('why','')) for c in d['contrastSet'] if isinstance(c,dict)) or 'header-provided contrast note'
if '--spec' not in sys.argv and (len(why)<25 or 'contrast set' in why): print("HARD why too short/template"); hard+=1
print("OK" if not hard else f"{hard} hard finding(s)"); sys.exit(1 if hard else 0)
