#!/usr/bin/env python3
"""Register a new ES module in the 6 shared files (idempotent).
Usage: register_es_module.py m4 "M4 · Where things are" "Module 4 · ¿Dónde está?" \
       "summary" "#10b981" "#059669" "Ask where anything is"
Run from the lingo repo root. mN.test.ts + tiers restructuring are separate.
"""
import sys, re

mod, title, eyebrow, summary, a1, a2, milestone = sys.argv[1:8]
n = int(mod[1:])
prev = f"m{n-1}"
UP, PUP = mod.upper(), prev.upper()

def edit(path, subs):
    s = open(path).read()
    changed = False
    for a, b in subs:
        if b in s:  # idempotent
            continue
        assert a in s, f"{path}: anchor not found: {a[:70]}"
        s = s.replace(a, b, 1)
        changed = True
    open(path, "w").write(s)
    print(("edited " if changed else "already ") + path)

# 1. courseAtoms.ts
p = "src/features/languages/es/courseAtoms.ts"
edit(p, [
    (f'import {{ ES_{PUP}_ATOMS }} from "./curriculum/{prev}";',
     f'import {{ ES_{PUP}_ATOMS }} from "./curriculum/{prev}";\nimport {{ ES_{UP}_ATOMS }} from "./curriculum/{mod}";'),
])
s = open(p).read()
old_union = re.search(r'export type EsAtomSource = ("m1"(?: \| "m\d+")*);', s).group(1)
if f'"{mod}"' not in old_union:
    s = s.replace(old_union, old_union + f' | "{mod}"', 1)
if f"...ES_{UP}_ATOMS," not in s:
    s = s.replace(f"    ...ES_{PUP}_ATOMS,\n  ]);", f"    ...ES_{PUP}_ATOMS,\n    ...ES_{UP}_ATOMS,\n  ]);", 1)
open(p, "w").write(s); print("edited " + p)

# 2. curriculum/index.ts
p = "src/features/languages/es/curriculum/index.ts"
s = open(p).read()
if f'from "./{mod}"' not in s:
    s = s.replace(f'import {{ ES_{PUP}_LESSONS }} from "./{prev}";',
                  f'import {{ ES_{PUP}_LESSONS }} from "./{prev}";\nimport {{ ES_{UP}_LESSONS }} from "./{mod}";', 1)
if f'id: "{mod}"' not in s:
    idx = s.index("];", s.index("ES_MODULE_META"))
    block = ('  {\n'
             f'    id: "{mod}",\n'
             f'    title: "{title}",\n'
             f'    eyebrow: "{eyebrow}",\n'
             f'    summary: "{summary}",\n'
             f'    accent: {{ from: "{a1}", to: "{a2}" }},\n'
             '  },\n')
    s = s[:idx] + block + s[idx:]
if f"  {mod}: ES_{UP}_LESSONS," not in s:
    s = s.replace(f"  {prev}: ES_{PUP}_LESSONS,\n}};", f"  {prev}: ES_{PUP}_LESSONS,\n  {mod}: ES_{UP}_LESSONS,\n}};", 1)
open(p, "w").write(s); print("edited " + p)

# 3. ES_MODULE_ORDER
p = "src/features/languages/es/grammarHelpers.ts"
edit(p, [(f'  "{prev}",\n];', f'  "{prev}",\n  "{mod}",\n];')])

# 4. placementBank
p = "src/features/languages/es/placementBank.ts"
edit(p, [
    (f'import {{ ES_{PUP}_PLACEMENT }} from "./curriculum/{prev}";',
     f'import {{ ES_{PUP}_PLACEMENT }} from "./curriculum/{prev}";\nimport {{ ES_{UP}_PLACEMENT }} from "./curriculum/{mod}";'),
    (f'  ["{prev}", ES_{PUP}_PLACEMENT],', f'  ["{prev}", ES_{PUP}_PLACEMENT],\n  ["{mod}", ES_{UP}_PLACEMENT],'),
])

# 5. milestones (index-keyed)
p = "src/features/learn/courseMapData.ts"
s = open(p).read()
if f'    {n-1}: "{milestone}",' not in s:
    anchor = '    2: "Name & count the things around you",'
    i = s.index(anchor)
    # find the last existing es milestone line before the closing brace of es block
    es_block_end = s.index("  },\n  fr: {", i)
    s = s[:es_block_end] + f'    {n-1}: "{milestone}",\n' + s[es_block_end:]
    open(p, "w").write(s)
print("edited " + p)

# 6. es-quality CHECKPOINT_INDEX
p = "src/features/languages/es/curriculum/es-quality.test.ts"
edit(p, [
    (f'import {{ ES_{PUP}_CHECKPOINT_INDEX }} from "./{prev}";',
     f'import {{ ES_{PUP}_CHECKPOINT_INDEX }} from "./{prev}";\nimport {{ ES_{UP}_CHECKPOINT_INDEX }} from "./{mod}";'),
    (f'  {prev}: ES_{PUP}_CHECKPOINT_INDEX,\n}};',
     f'  {prev}: ES_{PUP}_CHECKPOINT_INDEX,\n  {mod}: ES_{UP}_CHECKPOINT_INDEX,\n}};'),
])
print("registration done for", mod)
