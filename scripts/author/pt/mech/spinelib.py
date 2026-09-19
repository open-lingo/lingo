#!/usr/bin/env python3
"""Shared resolver for the PT writing/lint tools: spine lookup, prior vocabulary, closed function-word set.
A "lesson header" is either a spine entry (id pt-mN-K) or a spec/header file that carries the fields itself."""
import os, re, yaml
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..','..'))
SPINE=os.path.join(HERE,'..','spine','pt-spine.yaml')
CLOSED=set("e ou mas não sim com a o muito porque também só".split())
CAST=["Sam","Bia","Pedro","Rafael","Lúcia","Dona","Marina","Brasil","São","Paulo","Rio"]
TOK=re.compile(r"[A-Za-záàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]+")
_doc=None
def spine():
    global _doc
    if _doc is None: _doc=yaml.safe_load(open(SPINE,encoding='utf8'))
    return _doc
def lessons():
    out=[]
    for m in spine()['modules']:
        for l in m.get('lessons') or []:
            l=dict(l); l['moduleId']=m['id']; l['moduleTitle']=m.get('title'); l['arc']=m.get('arc'); out.append(l)
    return out
def parse_id(i):
    m=re.match(r'pt-m(\d+)-l?(\d+)$',i); return int(m.group(1)),int(m.group(2))
def find(i):
    mod,les=parse_id(i)
    for l in lessons():
        if parse_id(l['id'])==(mod,les): return l
    raise SystemExit(f"no spine lesson {i}")
def lesson_words(l):
    """[{pt,en,pos,gender,emoji}] — spine rows, or m1 atoms (surface only)."""
    if l.get('words'): return [dict(w) for w in l['words']]
    return [{'pt':('no' if a is False else 'sim' if a is True else str(a))} for a in l.get('atoms') or []]
def prior_words(i):
    """Every word taught before lesson i, in order (module, lesson)."""
    mod,les=parse_id(i); out=[]
    for l in lessons():
        m,k=parse_id(l['id'])
        if (m,k)<(mod,les):
            out+= [w['pt'] for w in lesson_words(l)]
    return out
def module_words(mod_id):
    out=[]
    for l in lessons():
        if l['moduleId']==mod_id and not l.get('checkpoint'): out+=[w['pt'] for w in lesson_words(l)]
    return out
def tokens_of(surfaces):
    s=set()
    for w in surfaces:
        for t in TOK.findall(str(w)): s.add(t.lower())
    return s
def header_from_spec(spec):
    """A spec with `spine:` inherits; a spec/header with its own fields is used as-is (m1 style)."""
    if spec.get('spine'):
        l=dict(find(spec['spine'])); l['lessonId']=spec['spine']
        for k in ('allow','allowExtra','recall','words','contrastSet','win'):   # a spec's own field wins (same merge rule as lib/spine.mjs)
            if spec.get(k) is not None: l[k]=spec[k]
        return l
    l={'id':spec['id'],'lessonId':spec['id'],'title':spec.get('title'),'point':spec.get('grammar'),'info':spec.get('info'),
       'words':spec.get('words') or [],'recall':spec.get('recall') or [],'allow':spec.get('allow') or [],
       'contrastSet':spec.get('contrastSet'),'cliffhanger':spec.get('cliffhanger'),'antiPattern':spec.get('antiPattern'),'win':spec.get('win'),'scene':spec.get('scene'),
       'moduleId':'m%d'%parse_id(spec['id'])[0]}
    sp=find(spec['id']); l['grammar']=sp.get('grammar'); l['checkpoint']=sp.get('checkpoint')
    return l
def allowed_tokens(header, extra_prior=None):
    lid=header.get('lessonId') or header['id']
    prior=prior_words(lid)+list(extra_prior or [])
    words=[w['pt'] for w in header.get('words') or []]
    return tokens_of(prior)|tokens_of(words)|tokens_of(header.get('recall') or [])|CLOSED|tokens_of(header.get('allow') or [])|tokens_of(header.get('allowExtra') or [])
