#!/usr/bin/env python3
"""reroll.py <spec.yaml> — mechanical scheduling repair: try role swaps (build/listen/speak) on the non-cloze, non-debut
sentences until from-spec.mjs accepts the spec. Keeps the writer's words; only roles move. Usage after a generator
'schedule:' complaint. Exit 1 if no assignment within the search budget."""
import sys, re, os, itertools, subprocess, shutil
F=sys.argv[1]; base=open(F,encoding='utf8').read()
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..','..','..'))
lines=base.split('\n'); idx=[i for i,l in enumerate(lines) if re.match(r'\s*- \{ pt: "', l)]
def roles_of(l): m=re.search(r'roles: \[([^\]]*)\]', l); return [r.strip() for r in m.group(1).split(',')] if m else []
flex=[i for i in idx if not any(r.startswith('"cloze') or r=='debut' for r in roles_of(lines[i])) and len(roles_of(lines[i]))==1 and roles_of(lines[i])[0] in ('build','listen','speak')]
def gen(txt):
    open(F,'w',encoding='utf8').write(txt)
    p=subprocess.run(['node','scripts/author/pt/from-spec.mjs',F],capture_output=True,text=True,cwd=ROOT,env={**os.environ,'PT_SPEC_OUT_DIR':'/tmp/reroll-out'})
    return bool(re.search(r'— \d+ steps',p.stdout)), (p.stderr+p.stdout)
ok,_=gen(base)
if ok: print('reroll: already passes'); sys.exit(0)
tried=0
for k in (1,2,3):
    for combo in itertools.combinations(flex,k):
        for newroles in itertools.product(('build','listen','speak'),repeat=k):
            if any(newroles[j]==roles_of(lines[combo[j]])[0] for j in range(k)): continue
            L=list(lines)
            for j,i in enumerate(combo): L[i]=re.sub(r'roles: \[[^\]]*\]', f'roles: [{newroles[j]}]', L[i])
            ok,err=gen('\n'.join(L)); tried+=1
            if ok: print(f'reroll: PASS after {tried} tries — swapped', [(i+1, roles_of(lines[i])[0], newroles[j]) for j,i in enumerate(combo)]); sys.exit(0)
            if tried>400: break
open(F,'w',encoding='utf8').write(base); print(f'reroll: no assignment in {tried} tries'); sys.exit(1)
