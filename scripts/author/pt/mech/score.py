#!/usr/bin/env python3
"""Collocation scoring for mechanical PT authoring (docs/pt-mechanical-authoring-2026-09-18.md §2), v2.
Tables: artifacts/lexical/pt/{bigrams,trigrams}.tsv (build: scripts/lexical/pt/build-ngrams.py).
lm(sent): mean log10 P(token | previous two) under stupid backoff (tri → 0.4·bi → 0.16·uni), per clause
  (split on . ! ? , ;), proper nouns (capitalised, not in the tables) are wildcards whose links are skipped.
slot_pmi(frame_words, z): log10 of how much more often z follows the frame than chance — the slot-class test.
band(): ACCEPT if lm >= HI, JUDGE if >= LO, else DISCARD. Thresholds calibrated on the shipped hand
sentences (positives) vs random frame fills (negatives) — see scripts/author/pt/mech/prove.py."""
import re, collections, functools, os, sys, math
ROOT=os.path.join(os.path.dirname(__file__),'..','..','..','..'); ART=os.path.join(ROOT,'artifacts','lexical','pt')
HI, LO = -2.6, -3.4
TOK=re.compile(r"[A-Za-záàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]+")
@functools.lru_cache(None)
def tables():
    bi=collections.Counter(); tri=collections.Counter(); uni=collections.Counter(); ctx2=collections.Counter()
    for l in open(f'{ART}/bigrams.tsv'):
        x,y,c=l.rstrip('\n').split('\t'); c=int(c); bi[(x,y)]=c; uni[x]+=c
    for l in open(f'{ART}/trigrams.tsv'):
        x,y,z,c=l.rstrip('\n').split('\t'); c=int(c); tri[(x,y,z)]=c; ctx2[(x,y)]+=c
    N=sum(uni.values()); return bi,tri,uni,ctx2,N
def clauses(s):
    for part in re.split(r"[.!?,;:]+", s):
        w=TOK.findall(part)
        if w: yield w
def norm_tokens(words):
    bi,tri,uni,ctx2,N=tables(); out=[]
    for i,w in enumerate(words):
        lw=w.lower()
        if lw in uni or lw in ('e','a','o'): out.append(lw)
        elif w[0].isupper() and i>0: out.append('*')          # proper noun mid-clause → wildcard
        elif w[0].isupper() and i==0 and lw not in uni: out.append('*')
        else: out.append(lw)                                    # unknown lowercase word: scored as unseen
    return out
def logp(x,y,z):
    bi,tri,uni,ctx2,N=tables()
    if ctx2[(x,y)] and tri[(x,y,z)]: return math.log10(tri[(x,y,z)]/ctx2[(x,y)])
    if uni[y] and bi[(y,z)]: return math.log10(0.4*bi[(y,z)]/uni[y])
    return math.log10(0.16*(uni[z]+0.5)/N)
def lm(s):
    vals=[]
    for words in clauses(s):
        t=['<s>','<s>']+norm_tokens(words)+['</s>']
        for i in range(2,len(t)):
            if '*' in t[i-2:i+1]: continue
            vals.append(logp(t[i-2],t[i-1],t[i]))
    return sum(vals)/len(vals) if vals else -9
def weakest(s):
    best=None
    for words in clauses(s):
        t=['<s>','<s>']+norm_tokens(words)+['</s>']
        for i in range(2,len(t)):
            if '*' in t[i-2:i+1]: continue
            v=logp(t[i-2],t[i-1],t[i])
            if best is None or v<best[0]: best=(v,t[i])
    return best
def slot_pmi(frame_words, z):
    """frame_words = last two words before the slot, e.g. ('gosto','de')."""
    bi,tri,uni,ctx2,N=tables(); x,y=frame_words; c=tri[(x,y,z)]
    if not c: return -9
    return math.log10((c/ctx2[(x,y)]) / ((uni[z]+0.5)/N))
def pair_pmi(x, z):
    """bigram PMI: how much more often z directly follows x than chance (verb → object slot)."""
    bi,tri,uni,ctx2,N=tables(); c=bi[(x,z)]
    if not c: return -9
    return math.log10((c/(uni[x] or 1)) / ((uni[z]+0.5)/N))
def band(s, hi=HI, lo=LO):
    v=lm(s); return 'ACCEPT' if v>=hi else ('JUDGE' if v>=lo else 'DISCARD')
if __name__=='__main__':
    for s in sys.argv[1:]: print(f"{lm(s):6.2f} {band(s):8} {s}   weakest={weakest(s)}")
