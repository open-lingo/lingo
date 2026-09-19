# Stream the OPUS OpenSubtitles2018 pt_BR mono corpus (gz) and count bigrams/trigrams
# restricted to tokens in the course word bank (lemmas + frequent surface forms) plus
# function words. Stops after MAX_LINES. Output: bigrams.tsv / trigrams.tsv (count desc).
import gzip, sys, re, json, collections, itertools
bank=json.load(open(sys.argv[1])); MAX_LINES=int(sys.argv[3]); out=sys.argv[4]
vocab=set()
for r in bank:
    vocab.add(r['lemma'])
    for f in r.get('forms',[]): vocab.add(f['form'] if isinstance(f,dict) else f[0] if isinstance(f,list) else f)
vocab|=set("o a os as um uma de do da dos das em no na nos nas e ou mas não sim com por para pra que se me te você eu ele ela nós a gente eles elas isso isto aquilo esse essa este esta aquele aquela meu minha seu sua dele dela muito mais menos só também já ainda aqui ali lá agora hoje amanhã bem mal onde quem como quando quanto porque".split())
tok=re.compile(r"[a-záàâãéêíóôõúüç]+")
bi=collections.Counter(); tri=collections.Counter(); n=0
with gzip.open(sys.argv[2],'rt',encoding='utf-8',errors='ignore') as f:
    for line in f:
        n+=1
        if n>MAX_LINES: break
        t=[w for w in tok.findall(line.lower())]
        t=['<s>']+[w if w in vocab else '_' for w in t]+['</s>']
        for i in range(len(t)-1):
            if t[i]!='_' and t[i+1]!='_': bi[(t[i],t[i+1])]+=1
        for i in range(len(t)-2):
            if '_' not in t[i:i+3]: tri[(t[i],t[i+1],t[i+2])]+=1
with open(out+'/bigrams.tsv','w') as o:
    for (x,y),c in bi.most_common():
        if c>=3: o.write(f"{x}\t{y}\t{c}\n")
with open(out+'/trigrams.tsv','w') as o:
    for (x,y,z),c in tri.most_common():
        if c>=3: o.write(f"{x}\t{y}\t{z}\t{c}\n")
print("lines",n-1,"bigrams",len(bi),"trigrams",len(tri))
