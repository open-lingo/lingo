#!/usr/bin/env python3
"""Mechanical arranger: choose 8–10 candidate sentences (ACCEPT band) so every role is filled and every lesson word
reaches its answer floor (≥3 graded positions), then emit the `sentences:` block. Greedy set-cover; no model call.
Usage: arrange.py <cands.md> "<lesson words space-separated>" "<contrast words>" [--function-words "de e não"]"""
import sys, re, collections, itertools
cands_path, words, contrast = sys.argv[1], sys.argv[2].split(), sys.argv[3].split()
FUNC=set((sys.argv[5] if len(sys.argv)>5 else "de e não sim também").split())
TOK=re.compile(r"[A-Za-záàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]+")
rows=[]
for ln in open(cands_path):
    m=re.match(r'- pmi ([\-\d.]+) lm ([\-\d.]+) \| (\d+)w \| (.+?) \| (.+)$', ln.strip())
    if m and '## JUDGE' not in ln: rows.append(dict(pmi=float(m[1]),lm=float(m[2]),n=int(m[3]),pt=m[4],en=m[5]))
    if ln.startswith('## JUDGE'): break
def uses(r): return [w for w in words if w in [t.lower() for t in TOK.findall(r['pt'])]]
for r in rows:
    r['uses']=uses(r); r['q']=r['pt'].endswith('?'); r['subj']=r['pt'].split()[0].lower()
    r['shape']=tuple(w for w in r['pt'].lower().replace('?','').replace('.','').split() if w not in set(words)|{'eu','você','bia','pedro','rafael','sam'})  # template signature
rows=[r for r in rows if not (r['subj']=='você' and not r['q'])]                      # (a) «você» declaratives are not statements
used_shapes=collections.Counter(); used_content=collections.Counter()
# roles to fill, in priority order; each picks the best unused row satisfying the predicate and maximising new coverage
need=collections.Counter({w:3 for w in words}); chosen=[]
def score(r):
    cov=sum(1 for w in r['uses'] if need[w]>0)
    div=-0.6*used_shapes[r['shape']]-0.3*used_content[tuple(sorted(r['uses']))]           # (b) diversity penalty
    return cov+div+0.01*(r['pmi']+r['lm'])
def pick(pred, roles):
    pool=[r for r in rows if r not in chosen and pred(r)]
    if not pool: return None
    r=max(pool,key=score); r['roles']=roles; chosen.append(r)
    used_shapes[r['shape']]+=1; used_content[tuple(sorted(r['uses']))]+=1
    for w in r['uses']: need[w]-=1
    return r
pick(lambda r: not r['q'] and r['n']<=4 and r['uses'], ["speak","debut"])           # short debut
# (c) every lesson word must be introduced on an intro-eligible row before any graded use: short listen rows first
for w in words:
    if any(w in c['uses'] for c in chosen): continue
    host=next((c for c in chosen if w in c['uses'] and not c['q'] and c['n']<=6 and c['roles'] in (['listen'],['speak'])), None)
    if host: host['roles']=host['roles']+['debut']; continue
    pick(lambda r,w=w: w in r['uses'] and not r['q'] and r['n']<=5, ["listen","debut"])
pick(lambda r: not r['q'] and r['n']>=5, ["build"]); pick(lambda r: not r['q'] and r['n']>=5, ["build"])
pick(lambda r: not r['q'], ["listen"]); pick(lambda r: r['q'], ["listen"])
for c in contrast:                                                                       # one cloze per contrast word
    pick(lambda r,c=c: c in [t.lower() for t in TOK.findall(r['pt'])] and not r['q'], [f"cloze:{c}","listen"])
cycle=itertools.cycle([["speak"],["build"],["listen"]])                                  # coverage top-up, roles rotated
while any(v>0 for v in need.values()) and len(chosen)<10:
    role=next(cycle)
    r=pick(lambda r,role=role: any(need[w]>0 for w in r['uses']) and (role!=["build"] or r['n']>=5), role)
    if not r: break
# role balance: at most 4 plain listen rows; extras become speak (statements) — the scheduler needs spacers
plain=[c for c in chosen if c['roles']==['listen'] or c['roles']==['listen','debut']]
for c in plain[4:]:
    if not c['q']: c['roles']=['speak']+(['debut'] if 'debut' in c['roles'] else [])
win=max([r for r in chosen if not r['q'] and r['pt'].lower().startswith('eu ')], key=lambda r:(len(r['uses']),r['n']), default=chosen[0])   # (e) richest first-person line
print("sentences:")
for r in chosen:
    roles=', '.join(f'"{x}"' if ':' in x else x for x in r['roles'])
    print(f'  - {{ pt: "{r["pt"]}", en: "{r["en"]}", roles: [{roles}], uses: [{", ".join(r["uses"])}] }}')
print(f'win: {{ pt: "{win["pt"]}", en: "{win["en"]}" }}')
short=[w for w,v in need.items() if v>0]
print(f"# coverage: {len(chosen)} sentences; words below floor: {short or 'none'}", file=sys.stderr)
