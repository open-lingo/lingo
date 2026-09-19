#!/usr/bin/env python3
"""Proof harness: shipped hand sentences (positives) vs random frame fills (negatives)."""
import sys, os, json, glob, random, collections
sys.path.insert(0, os.path.dirname(__file__)); import score as S
random.seed(1)
pos=set()
for f in glob.glob('src/pub/content/v1/pt/*.json'):
    if 'index' in f: continue
    def walk(o):
        if isinstance(o,dict):
            for k,v in o.items():
                if k in('pt','audioText') and isinstance(v,str) and len(S.TOK.findall(v))>=3: pos.add(v)
                walk(v)
        elif isinstance(o,list):
            for x in o: walk(x)
    walk(json.load(open(f)))
pos=sorted(pos)
bank=[r for r in json.load(open('scripts/author/pt/data/pt-wordbank.json')) if r['brRank']<=600]
nouns=[r for r in bank if r['pos']=='NOUN']; verbs=[r['lemma'] for r in bank if r['pos']=='VERB']
art=lambda r: 'um' if (r.get('gender') or 'm')=='m' else 'uma'
neg=set()
while len(neg)<200:
    n=random.choice(nouns); v=random.choice(verbs)
    neg.add(random.choice([f"Eu tenho {art(n)} {n['lemma']}.", f"Eu gosto de {n['lemma']}.", f"Eu estou {art(n)} {n['lemma']}.", f"Eu sou de {n['lemma']}.", f"Você gosta de {v}?"]))
neg=sorted(neg)
def dist(xs): c=collections.Counter(S.band(x) for x in xs); return {k:c[k] for k in['ACCEPT','JUDGE','DISCARD']}
print(f"positives {len(pos)}: {dist(pos)}   negatives {len(neg)}: {dist(neg)}")
print("false rejects (hand → DISCARD):"); [print(f"  {S.lm(p):6.2f} {p}  weakest={S.weakest(p)}") for p in pos if S.band(p)=='DISCARD']
print("false accepts (random → ACCEPT), top:"); [print(f"  {S.lm(n):6.2f} {n}") for n in sorted(neg,key=lambda x:-S.lm(x)) if S.band(n)=='ACCEPT'][:10]
print("\nslot PMI after 'gosto de' (class membership, higher = belongs):")
for z in ['música','pizza','filme','família','pai','você','trabalhar','volta','acordo','tempo','vida','segurança','comer','gato','casa']:
    print(f"  {S.slot_pmi(('gosto','de'),z):6.2f} {z}")
print("slot PMI after 'tenho um':"); [print(f"  {S.slot_pmi(('tenho','um'),z):6.2f} {z}") for z in ['problema','amigo','gato','tempo','hospital','café','carro','plano','irmão']]
