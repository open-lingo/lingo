import re,glob,sys
S="/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/"
bad=0
for f in sorted(glob.glob(S+sys.argv[1]+"-L*.yaml")):
    for m in re.finditer(r'goal: "([^"]+)"', open(f).read()):
        if len(m.group(1).split())>8: bad+=1; print("LONG", f.split("/")[-1], len(m.group(1).split()), m.group(1))
print("goals scanned, long =", bad)
