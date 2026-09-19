#!/usr/bin/env python3
"""Draw-until-coherent for ARRANGEMENT: start from arrange.py's pick, run the generator, parse its one error line,
apply the mechanical fix it names, repeat (≤12 rounds). No model call.
Usage: arrange-loop.py <cands.md> "<words>" "<contrast>" <header.yaml> <dialogue+why.yaml> <spec-out.yaml> <out-dir>"""
import sys, re, subprocess, os, itertools, collections
cands, words, contrast, header, tail, spec_out, out_dir = sys.argv[1:8]
words_l=words.split()
TOK=re.compile(r"[A-Za-záàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]+")
rows=[]
for ln in open(cands):
    if ln.startswith('## JUDGE'): break
    m=re.match(r'- pmi ([\-\d.]+) lm ([\-\d.]+) \| (\d+)w \| (.+?) \| (.+)$', ln.strip())
    if m: rows.append(dict(pmi=float(m[1]),lm=float(m[2]),n=int(m[3]),pt=m[4],en=m[5].split(',')[0] if ' to ' not in m[5] else m[5]))
for r in rows: r['toks']=[t.lower() for t in TOK.findall(r['pt'])]; r['uses']=[w for w in words_l if w in r['toks']]; r['q']=r['pt'].endswith('?')
base=subprocess.run(['python3','scripts/author/pt/mech/arrange.py',cands,words,contrast],capture_output=True,text=True).stdout
chosen=[]
for ln in base.splitlines():
    m=re.match(r'  - \{ pt: "(.+?)", en: "(.+?)", roles: \[(.+?)\], uses: \[(.*?)\] \}', ln)
    if m: chosen.append(dict(pt=m[1],en=m[2],roles=[x.strip().strip('"') for x in m[3].split(',')],uses=[x.strip() for x in m[4].split(',') if x.strip()]))
win=re.search(r'^win:.*$', base, re.M).group(0)
tail_txt=open(tail).read()
CLOSED=set("e ou mas não sim com a o muito porque também só de".split()); extra_allow=set()
hdr_src=open(header).read()
def write():
    hdr=hdr_src
    if extra_allow:
        m=re.search(r'^allow: \[(.*?)\]', hdr, re.M)
        cur=[x.strip() for x in m.group(1).split(',') if x.strip()] if m else []
        line='allow: ['+', '.join(dict.fromkeys(cur+sorted(extra_allow)))+']'
        hdr=re.sub(r'^allow: \[.*?\]', line, hdr, count=1, flags=re.M) if m else hdr.rstrip('\n')+'\n'+line+'\n'
    open(spec_out+'.hdr','w').write(hdr)
    body="sentences:\n"+"".join(f'  - {{ pt: "{c["pt"]}", en: "{c["en"]}", roles: [{", ".join(chr(34)+x+chr(34) if ":" in x else x for x in c["roles"])}], uses: [{", ".join(c["uses"])}] }}\n' for c in chosen)+win+"\n"+tail_txt
    open(spec_out+'.body','w').write(body)
    subprocess.run(['python3','scripts/author/pt/mech/assemble.py',spec_out+'.hdr',spec_out+'.body',spec_out],capture_output=True)
def gen():
    p=subprocess.run(['node','scripts/author/pt/from-spec.mjs',spec_out],capture_output=True,text=True,env={**os.environ,'PT_SPEC_OUT_DIR':out_dir})
    err=[l for l in (p.stdout+p.stderr).splitlines() if ('from-spec:' in l or l.startswith('spec:')) and ' steps, ' not in l]
    if p.returncode==0 and not err:                        # generator ok → run the checker too
        n=re.search(r'lesson: (\d+)', open(spec_out).read()).group(1)
        c=subprocess.run(['bash','scripts/author/pt/check.sh',n,'6'],capture_output=True,text=True,env={**os.environ,'PT_SPEC_OUT_DIR':out_dir})
        fails=[l for l in c.stdout.splitlines() if l.startswith('FAIL')]
        return (1 if fails else 0), (fails[0] if fails else '')
    return p.returncode, (err[0] if err else '')
roles_cycle=itertools.cycle([["listen"],["speak"],["build"]])
def unused(pred): 
    pool=[r for r in rows if r['pt'] not in {c['pt'] for c in chosen} and pred(r)]
    return max(pool,key=lambda r:r['pmi']+r['lm']) if pool else None
log=[]
for rnd in range(1,13):
    write(); rc,err=gen()
    if rc==0 and not err: log.append(f"round {rnd}: PASS ({len(chosen)} sentences)"); break
    log.append(f"round {rnd}: {err[-120:] if err else '(no error line captured)'}")
    if len(chosen)>=13: log.append("  sentence cap reached — stop"); break
    m=re.search(r'atom "(\w+)" only has (\d+) answer position', err)
    if m:
        w=m[1]; role=next(roles_cycle); r=unused(lambda r: w in r['uses'] and (role!=['build'] or r['n']>=5) and not r['q'])
        if r: chosen.append(dict(pt=r['pt'],en=r['en'],roles=role,uses=r['uses'])); continue
        for c in chosen:                                  # fallback: promote a listen row using w to a cloze on w
            if w in c['uses'] and c['roles']==['listen']: c['roles']=[f"cloze:{w}","listen"]; break
        continue
    m=re.search(r'two adjacent "(\w+)"', err)
    if m:
        kind={'listenCompLit':'listen','buildLit':'build','speakLit':'speak','clozeLit':'listen'}.get(m[1],'listen')
        other=['speak'] if kind!='speak' else ['build']
        swap=next((c for c in chosen if c['roles']==[kind] and not c['q'] and (other!=['build'] or len(c['pt'].split())>=5)), None)
        if swap: swap['roles']=other; continue                      # first: re-role an existing row (no bloat)
        r=unused(lambda r: not r['q'] and (other!=['build'] or r['n']>=5))
        if r: chosen.append(dict(pt=r['pt'],en=r['en'],roles=other,uses=r['uses'])); continue
    m=re.search(r'FAIL taught-vocab-residual — (.*)$', err)
    if m:
        ws=set(re.findall(r'"(\w+)"', m.group(1))); ok=ws & CLOSED
        if ok: extra_allow.update(ok); continue
        log.append(f"  untaught content word(s) {ws-CLOSED} — drop rows using them"); 
        for w in ws-CLOSED:
            for c in list(chosen):
                if w in c['pt'].lower().split(): chosen.remove(c)
        continue
    m=re.search(r'FAIL intro-capable-first-appearance — (\S+) first printed on', err)
    if m:
        w=m[1]; r=unused(lambda r: w in r['uses'] and not r['q'] and r['n']<=5)
        if r: chosen.insert(0, dict(pt=r['pt'],en=r['en'],roles=['speak','debut'],uses=r['uses'])); continue
        for c in chosen:
            if w in c['uses'] and 'debut' not in c['roles']: c['roles']=['speak','debut']; chosen.remove(c); chosen.insert(0,c); break
        continue
    m=re.search(r'uses references "(\w+)"', err)
    if m:
        for c in chosen: c['uses']=[u for u in c['uses'] if u!=m[1]]
        continue
    m=re.search(r'"(.+?)" has (\d) tiles .* not tagged "debut"', err)
    if m:
        for c in chosen:
            if c['pt']==m[1]: c['roles']=['listen']
        continue
    log.append("  no mechanical fix known — stop"); break
print("\n".join(log))
