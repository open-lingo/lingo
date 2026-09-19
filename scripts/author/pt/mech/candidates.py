#!/usr/bin/env python3
"""Candidate sentences for a lesson from typed frames × allowed words, scored by slot PMI (against the governing
verb) and the backed-off LM; printed by band with a composed English gloss. Usage: candidates.py <l3|l5> """
import sys, os, json, re, glob, itertools
sys.path.insert(0, os.path.dirname(__file__)); import score as S
bank={r['lemma']:r for r in json.load(open('scripts/author/pt/data/pt-wordbank.json'))}
GLOSS={}
for f in glob.glob('src/features/languages/pt/courseAtoms.m1-l*.ts'):
    txt=open(f).read()
    for block in re.findall(r'\{[^{}]*surface:[^{}]*\}', txt, re.S):
        a=re.search(r'surface:\s*"([^"]+)"', block); b=re.search(r'meaningEn:\s*"([^"]+)"', block)
        if a and b: GLOSS[a.group(1).lower()]=b.group(1).split(' (')[0].split(' /')[0]
SUBJ=[("eu","1"),("você","2"),("ele","3"),("ela","3"),("Bia","3"),("Pedro","3"),("Rafael","3")]
EN_SUBJ={"eu":"I","você":"you","ele":"he","ela":"she","Bia":"Bia","Pedro":"Pedro","Rafael":"Rafael"}
LESSONS={
 "l3": dict(verb={"1":"tenho","2":"tem","3":"tem"}, en_verb={"1":"have","2":"have","3":"has"}, gov="tenho",
            nouns=["família","irmã","amigo","gato","cidade","país","professor","estudante"],
            frames=[("{S} {V} um {Nm}.","{s} {v} a {nm}."),("{S} {V} uma {Nf}.","{s} {v} a {nf}."),("{S} não {V} {N}.","{s} {neg} have a {n}."),
                    ("Você tem um {Nm}?","Do you have a {nm}?"),("Você tem uma {Nf}?","Do you have a {nf}?"),
                    ("{S} {V} uma {Nf} e um {Nm}.","{s} {v} a {nf} and a {nm}."),("{S} {V} um {Nm} e uma {Nf}.","{s} {v} a {nm} and a {nf}.")]),
 "l5": dict(verb={"1":"gosto","2":"gosta","3":"gosta"}, en_verb={"1":"like","2":"like","3":"likes"}, gov="gosto",
            nouns=["música","pizza","filme","café","família","cidade","Brasil"], verbs=["comer","falar","assistir"],
            frames=[("{S} {V} de {N}.","{s} {v} {n}."),("{S} {V} de {Vinf}.","{s} {v} to {vinf}."),("{S} {V} de {Vinf} {N}.","{s} {v} to {vinf} {n}."),
                    ("Você gosta de {N}?","Do you like {n}?"),("Você gosta de {Vinf}?","Do you like to {vinf}?"),("{S} não {V} de {N}.","{s} {neg} like {n}."),
                    ("{S} {V} de {N} e de {N2}.","{s} {v} {n} and {n2}."),("{S} {V} de {Vinf} {N} e {Vinf2} {N2}.","{s} {v} to {vinf} {n} and {vinf2} {n2}.")])}
def gl(w): return GLOSS.get(w.lower(), w)
def run(key):
    L=LESSONS[key]; out=[]
    nouns=L["nouns"]; verbs=L.get("verbs",[])
    for (fr,en) in L["frames"]:
        slots=re.findall(r'\{(Nm|Nf|N2|N|Vinf2|Vinf)\}', fr)
        pools=[]
        for sl in slots:
            if sl=="Nm": pools.append([n for n in nouns if (bank.get(n,{}).get('gender') or 'm')=='m' and n[0].islower()])
            elif sl=="Nf": pools.append([n for n in nouns if bank.get(n,{}).get('gender')=='f'])
            elif sl in("N","N2"): pools.append(nouns)
            else: pools.append(verbs)
        subjs=SUBJ if "{S}" in fr else [("você","2")]
        for (s,p),combo in itertools.product(subjs, itertools.product(*pools)):
            if len(set(combo))<len(combo): continue
            v=L["verb"][p]; sent=fr.replace("{S}",s).replace("{V}",v); eng=en.replace("{s}",EN_SUBJ[s]).replace("{v}",L["en_verb"][p]).replace("{neg}","do not" if p!="3" else "does not")
            pmis=[]; prev_verb=None
            for sl,w in zip(slots,combo):
                if sl.startswith("Vinf"): prev_verb=w
                elif prev_verb and sl.startswith("N"):
                    pmis.append(S.pair_pmi(prev_verb, w)); prev_verb=None
                    sent=sent.replace("{"+sl+"}",w,1); eng=eng.replace("{"+sl.lower()+"}",gl(w),1); continue
                sent=sent.replace("{"+sl+"}",w,1); eng=eng.replace("{"+sl.lower()+"}",gl(w),1)
                art = "um" if sl=="Nm" else "uma" if sl=="Nf" else "de"
                pmis.append(S.slot_pmi((L["gov"],art), w) if sl.startswith("N") else S.slot_pmi((L["gov"],"de"), w))
            sent=sent[0].upper()+sent[1:]; eng=eng[0].upper()+eng[1:]
            lm=S.lm(sent); pmi=min(pmis) if pmis else 0
            band='ACCEPT' if (pmi>=1 and lm>=S.HI) else ('DISCARD' if (pmi<0 or lm<S.LO) else 'JUDGE')
            out.append((band,pmi,lm,sent,eng))
    out.sort(key=lambda r:(r[0]!='ACCEPT', r[0]!='JUDGE', -(r[1]+r[2])))
    return out
if __name__=='__main__':
    key=sys.argv[1]; rows=run(key)
    import collections; c=collections.Counter(r[0] for r in rows)
    print(f"# candidates {key}: {len(rows)} → {dict(c)}\n")
    for band in ['ACCEPT','JUDGE']:
        print(f"## {band}"); 
        for b,p,l,s,e in rows:
            if b==band: print(f"- pmi {p:4.2f} lm {l:5.2f} | {s} | {e}")
        print()
