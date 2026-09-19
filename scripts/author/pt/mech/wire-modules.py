#!/usr/bin/env python3
"""wire-modules.py m2 [m3 m4] — idempotent wiring of compiled PT modules into the app:
courseAtoms.ts side-effect imports (every existing courseAtoms.mN-lK.ts), PtAtomSource union,
curriculum/index.ts (import + PT_MODULE_META row + LESSONS_BY_MODULE), ptRegistration.test.ts module-count pin.
Run AFTER `compile-ir-pt.mjs mN` wrote curriculum/mN.ts. Then `npm run content:emit`."""
import sys, re, os, glob
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..','..','..')); PT=os.path.join(ROOT,'src/features/languages/pt')
META={'m2':('Na cidade','Module 2 · Na cidade','querer, the articles, question words, -ar verbs and ir/vir — moving in.',('#6366f1','#8b5cf6')),
      'm3':('A viagem','Module 3 · A viagem','poder/precisar, the days and time, -er/-ir verbs, paying and the bus.',('#f59e0b','#ea580c')),
      'm4':('No Rio','Module 4 · No Rio','ficar, the market, the beach, a doctor, and saying goodbye — end of A1.',('#0ea5e9','#0284c7'))}
mods=sys.argv[1:] or ['m2','m3','m4']
def rw(path, fn):
    s=open(path,encoding='utf8').read(); t=fn(s)
    if t!=s: open(path,'w',encoding='utf8').write(t); print("edited", os.path.relpath(path,ROOT))
    else: print("unchanged", os.path.relpath(path,ROOT))
# 1. courseAtoms.ts imports + PtAtomSource
def atoms(s):
    have=set(re.findall(r'import "\./courseAtoms\.(m\d+-l\d+)";', s))
    files=sorted((os.path.basename(f)[len('courseAtoms.'):-3] for f in glob.glob(os.path.join(PT,'courseAtoms.m*-l*.ts'))), key=lambda x:(int(x.split('-')[0][1:]),int(x.split('-l')[1])))
    for f in files:
        if f in have: continue
        assert 'STUB from the spine' not in open(os.path.join(PT,f'courseAtoms.{f}.ts')).read(), f"{f} is still a spine stub"
        last=[m for m in re.finditer(r'import "\./courseAtoms\.m\d+-l\d+";\n', s)][-1]
        s=s[:last.end()]+f'import "./courseAtoms.{f}";\n'+s[last.end():]
    srcs=sorted({'m1'}|set(mods), key=lambda m:int(m[1:]))
    s=re.sub(r'export type PtAtomSource = [^;]+;', 'export type PtAtomSource = '+' | '.join(f'"{m}"' for m in srcs)+';', s)
    return s
rw(os.path.join(PT,'courseAtoms.ts'), atoms)
# 2. curriculum/index.ts
def index(s):
    for m in mods:
        M=m.upper()
        if not os.path.exists(os.path.join(PT,'curriculum',f'{m}.ts')): print(f"skip {m}: curriculum/{m}.ts not compiled"); continue
        if f'from "./{m}"' not in s:
            s=s.replace('import { PT_M1_LESSONS } from "./m1";', 'import { PT_M1_LESSONS } from "./m1";\n'+f'import {{ PT_{M}_LESSONS }} from "./{m}";',1) if f'import {{ PT_{M}_LESSONS }}' not in s else s
            # keep imports ordered: append after the last PT_M*_LESSONS import
            s=re.sub(r'(import \{ PT_M\d+_LESSONS \} from "\./m\d+";\n)(?!import \{ PT_M)', lambda mm: mm.group(1), s)
        if f'id: "{m}"' not in s:
            t,eb,sm,(a,b)=META[m]
            row=f'''  {{
    id: "{m}",
    title: "{t}",
    eyebrow: "{eb}",
    summary: "{sm}",
    accent: {{ from: "{a}", to: "{b}" }},
  }},
'''
            s=s.replace('];\n\nconst LESSONS_BY_MODULE', row+'];\n\nconst LESSONS_BY_MODULE',1)
        if f'  {m}: PT_{M}_LESSONS,' not in s:
            s=s.replace('  m1: PT_M1_LESSONS,\n', '  m1: PT_M1_LESSONS,\n'+f'  {m}: PT_{M}_LESSONS,\n',1)
    return s
rw(os.path.join(PT,'curriculum','index.ts'), index)
# 3. ptRegistration pin
def pin(s):
    n=1+sum(1 for m in mods if os.path.exists(os.path.join(PT,'curriculum',f'{m}.ts')))
    return re.sub(r'expect\(m\.curriculum\.length, "pt m1 compiles to one module"\)\.toBe\(\d+\)', f'expect(m.curriculum.length, "pt m1 compiles to one module").toBe({n})', s)
rw(os.path.join(ROOT,'src/shared/language/__tests__/ptRegistration.test.ts'), pin)
