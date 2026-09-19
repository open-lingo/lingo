#!/usr/bin/env python3
"""Standalone lint for a written PT spec (no generator needed): vocabulary walls, roles/coverage, build floor, debut-first,
contrast clozes, LM fluency floor, dialogue structure. Usage: spec-lint.py <spec.yaml> [--body body.yaml] [--prior "w1 w2"]
Exit 1 on any HARD line. ≤ 25 lines."""
import sys, re, os, yaml, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import spinelib as S
ap=argparse.ArgumentParser(); ap.add_argument('spec'); ap.add_argument('--prior',default=''); ap.add_argument('--fix-allow',action='store_true'); a=ap.parse_args()
try: spec=yaml.safe_load(open(a.spec,encoding='utf8'))
except Exception as e: print("HARD yaml:", str(e)[:120]); sys.exit(1)
_keys=[l.split(':')[0] for l in open(a.spec,encoding='utf8') if re.match(r'^[A-Za-z]\w*:', l)]
_dups=sorted({k for k in _keys if _keys.count(k)>1})
if _dups: print(f"HARD duplicate top-level keys {_dups} (the generator's YAML parser rejects the file)"); sys.exit(1)
h=S.header_from_spec(spec)
# the generator's residual check accepts a closed-set function word ONLY when the spec's own `allow:` names it
_texts=[x.get('pt','') for x in (spec.get('sentences') or [])]
for _t in ((spec.get('dialogue') or {}).get('turns') or []):
    _texts+=[_t.get('npc','')]+list(_t.get('options') or [])+[_t.get('answer','')]+list(_t.get('tiles') or [])
_used=sorted({w.lower() for x in _texts for w in S.TOK.findall(str(x)) if w.lower() in S.CLOSED})
_declared=[str(x) for x in (spec.get('allow') or [])]
_missing=[w for w in _used if w not in _declared]
if _missing and a.fix_allow:
    _new=sorted(set(_declared)|set(_used)); _line="allow: ["+", ".join(_new)+"]"
    _raw=open(a.spec,encoding='utf8').read().split('\n')
    _idx=[i for i,l in enumerate(_raw) if l.startswith('allow:')]
    if _idx: _raw[_idx[0]]=_line
    else:
        _after=[i for i,l in enumerate(_raw) if l.startswith('spine:') or l.startswith('id:')]
        _raw.insert((_after[-1]+1) if _after else 0,_line)
    open(a.spec,'w',encoding='utf8').write('\n'.join(_raw)); spec['allow']=_new; _missing=[]
    print(f"spec-lint: rewrote {_line}")
h=S.header_from_spec(spec); allowed=S.allowed_tokens(h, a.prior.split())
names={n.lower() for n in S.CAST}
words=[w['pt'] for w in (h.get('words') or [])]; recall=[str(r) for r in (h.get('recall') or [])]
sents=spec.get('sentences') or []; out=[]; hard=0
def H(m):
    global hard; hard+=1; out.append("HARD "+m)
def W(m): out.append("WARN "+m)
def toks(s): return S.TOK.findall(str(s))
_plural_ok=('os' in allowed and 'as' in allowed)
def _known(t):
    if t in allowed: return True
    if not _plural_ok: return False
    return any(x in allowed for x in (re.sub(r's$','',t), re.sub(r'ões$','ão',t), re.sub(r'ães$','ão',t), re.sub(r'is$','l',t), re.sub(r'ns$','m',t), re.sub(r'es$','',t)) if x!=t)
def vocab_check(where,s):
    bad=[t for t in toks(s) if t.lower() not in allowed and not (t[0].isupper() and (t.lower() in names or t[0].isupper()))]
    # capitalised tokens are exempt only if they are names; a capitalised ordinary word at sentence start is checked lowercase
    bad=[t for t in toks(s) if not _known(t.lower()) and t.lower() not in names]
    if bad: H(f"{where} untaught: {sorted(set(bad))} «{s}»")
if not (8<=len(sents)<=14): H(f"{len(sents)} sentences (want 10–13)")
if _missing: H(f"function words used but not declared in allow: {_missing} (run with --fix-allow)")
seen=set(); first={}; usecount={}; roles_all=[]
for i,s in enumerate(sents,1):
    pt=s.get('pt',''); roles=[str(r) for r in (s.get('roles') or [])]; uses=[str(u) for u in (s.get('uses') or [])]
    roles_all+=roles
    if pt in seen: H(f"s{i} duplicate «{pt}»")
    seen.add(pt); vocab_check(f"s{i}",pt)
    if len(roles)>3: H(f"s{i} {len(roles)} roles (max 3)")
    nw=len(toks(pt))
    if 'build' in roles and nw<5 and 'debut' not in roles: H(f"s{i} build with {nw} words and no debut «{pt}»")
    low={t.lower() for t in toks(pt)}
    newhere=[w for w in words if S.tokens_of([w])<=low and w not in first]
    for w in newhere: first[w]=i
    if newhere and 'debut' not in roles and all(r.startswith('cloze:') for r in roles): H(f"s{i} first appearance of {newhere} only on a cloze (not intro-capable) «{pt}»")
    for u in uses:
        if u not in words and u not in recall: W(f"s{i} uses «{u}» is not a new/recall word")
        usecount[u]=usecount.get(u,0)+1
    if re.match(r'^Você \w', pt) and not pt.endswith('?'): W(f"s{i} «você» declarative «{pt}»")
    if s.get('en','').lower().startswith('to to'): H(f"s{i} gloss «{s.get('en')}»")
for w in words:
    if w not in first: H(f"new word «{w}» never appears in a sentence")
    c=usecount.get(w,0)
    if c<1: H(f"«{w}» in uses of no sentence")
    elif c<3: W(f"«{w}» in uses of {c} sentences (want ≥3; sim options + match pairs also count)")
n=lambda r: sum(1 for x in roles_all if x==r)
if n('build')<3: H(f"build roles {n('build')} (want ≥3)")
if n('listen')<2: H(f"listen roles {n('listen')} (want ≥2)")
if n('speak')<1: H("no mid-lesson speak role")
if sum(1 for x in roles_all if x.startswith('cloze:'))<2: H("fewer than 2 cloze roles")
if not any(s.get('pt','').endswith('?') for s in sents): H("no question sentence")
cs=spec.get('contrastSet') or []
for c in cs:
    st=c.get('set') if isinstance(c,dict) else c
    if isinstance(c,dict) and len(str(c.get('why','')))<25: H(f"contrastSet {st} why < 25 chars")
    for w in st or []:
        if f"cloze:{w}" not in roles_all: W(f"contrast form «{w}» has no cloze role")
# LM fluency floor
try:
    import score
    def lm3(sent):
        vals=[]
        for ws in score.clauses(sent):
            if len(ws)<3: continue
            t=['<s>','<s>']+score.norm_tokens(ws)+['</s>']
            vals+=[score.logp(t[j-2],t[j-1],t[j]) for j in range(2,len(t)) if '*' not in t[j-2:j+1]]
        return sum(vals)/len(vals) if vals else None
    for i,s in enumerate(sents,1):
        v=lm3(s.get('pt',''))
        if v is None: continue
        if v<-4.0: H(f"s{i} lm {v:.2f} (gibberish floor) «{s.get('pt')}»")
        elif v<score.LO: W(f"s{i} lm {v:.2f} below band «{s.get('pt')}»")
except FileNotFoundError: W("lm tables missing — fluency floor skipped")
# dialogue
d=spec.get('dialogue') or {}; turns=d.get('turns') or []
if len(turns)<1: H("dialogue has no turns")
elif len(turns)<3: W(f"dialogue turns={len(turns)} (want 3)")
for i,t in enumerate(turns,1):
    for s in list(t.get('options') or [])+[t.get('answer','')]+list(t.get('tiles') or []):
        if s: vocab_check(f"t{i}",s)
    bad=[x for x in toks(t.get('npc','')) if not _known(x.lower()) and x.lower() not in names]
    if bad: W(f"t{i} NPC line beyond vocabulary: {sorted(set(bad))}")
    if not t.get('gloss'): H(f"t{i} no gloss")
    if len(str(t.get('goal','')).split())>8: H(f"t{i} goal > 8 words")
    if t.get('mode')=='build':
        ans=str(t.get('answer','')); tiles=[str(x) for x in (t.get('tiles') or [])]
        if ans[-1:] in '.!?': H(f"t{i} answer ends with punctuation")
        if not set(ans.split())<=set(tiles): H(f"t{i} answer words not all in tiles")
        if len(tiles)<len(ans.split())+2: H(f"t{i} fewer than 2 wrong tiles")
    else:
        opts=[str(o) for o in (t.get('options') or [])]
        if len(opts)<2: H(f"t{i} {len(opts)} options")
        elif len(opts)!=3: W(f"t{i} {len(opts)} options (want 3)")
        if len(set(opts))!=len(opts): H(f"t{i} duplicate options")
        c=t.get('correct')
        if not isinstance(c,int) or not (0<=c<len(opts)): H(f"t{i} bad correct index")
        if opts and all(len(o.split())<=1 for o in opts): W(f"t{i} one-word options")
        for o in opts:
            if re.search(r'\bgost\w+ de [^,]+, não (?!de\b|gost)', o.lower()): H(f"t{i} dropped «de» after não: «{o}»")
print("\n".join(out[:24]) if out else "spec-lint: clean")
print(f"spec-lint: {'FAIL' if hard else 'PASS'} ({hard} hard, {len(out)-hard} warn)")
sys.exit(1 if hard else 0)
