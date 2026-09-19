#!/usr/bin/env python3
"""assemble.py <header.yaml> <model-output.yaml> <spec-out.yaml> — the model writes only sentences/win/dialogue/why;
the header (title, info, words, antiPattern, contrastSet, allow) is fixed boilerplate from the spine or a prior spec."""
import sys, re
hdr=open(sys.argv[1]).read().rstrip('\n'); body=open(sys.argv[2]).read()
body=re.sub(r'^```[a-z]*\n|\n```\s*$', '', body.strip(), flags=re.M)   # strip code fences if any
body=re.sub(r'^(lesson|id):.*\n', '', body, flags=re.M)                  # header owns these
why=re.search(r'^why:\s*"?(.*?)"?\s*$', body, re.M)
if why:
    hdr=re.sub(r'note: "[^"]*"', f'note: "{why.group(1)}"', hdr, count=1); body=re.sub(r'^why:.*\n?', '', body, flags=re.M)
open(sys.argv[3],'w').write(hdr+'\n'+body.strip()+'\n'); print('assembled', sys.argv[3])
