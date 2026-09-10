# python3 register-mod.py <prev> <new> "<title>" "<eyebrow>" "<summary>" "<from>" "<to>"
# Registers ES m<new> at the 6 code points after m<prev> (run AFTER compile-ir-es), then regen the review pool by hand.
import sys
prev, new, title, eyebrow, summary, cfrom, cto = sys.argv[1:8]
P, N = prev.upper(), new.upper()
import os; R = os.environ.get("LINGO_ROOT", "/Users/lichfield/Documents/projects/lingle/lingo") + "/src/features/languages/es/"
def edit(p, old, newtxt, count=1):
    s = open(p).read()
    assert s.count(old) == count, (p, old[:70], s.count(old))
    open(p, "w").write(s.replace(old, newtxt))
s = open(R + "curriculum/index.ts").read()
i = s.index(f'    id: "{prev}",'); j = s.index("  },", i) + 4
card = s[i-4:j]  # "  {\n    id: ..." block
assert card.startswith("  {"), card[:20]
newcard = f'''  {{
    id: "{new}",
    title: "{title}",
    eyebrow: "{eyebrow}",
    summary: "{summary}",
    accent: {{ from: "{cfrom}", to: "{cto}" }},
  }},
'''
edit(R + "curriculum/index.ts", card, card + newcard)
edit(R + "curriculum/index.ts", f'import {{ ES_{P}_LESSONS }} from "./{prev}";\n', f'import {{ ES_{P}_LESSONS }} from "./{prev}";\nimport {{ ES_{N}_LESSONS }} from "./{new}";\n')
edit(R + "curriculum/index.ts", f'  {prev}: ES_{P}_LESSONS,\n', f'  {prev}: ES_{P}_LESSONS,\n  {new}: ES_{N}_LESSONS,\n')
edit(R + "grammarHelpers.ts", f'  "{prev}",\n', f'  "{prev}",\n  "{new}",\n')
edit(R + "courseAtoms.ts", f'import {{ ES_{P}_ATOMS }} from "./curriculum/{prev}";\n', f'import {{ ES_{P}_ATOMS }} from "./curriculum/{prev}";\nimport {{ ES_{N}_ATOMS }} from "./curriculum/{new}";\n')
edit(R + "courseAtoms.ts", f'| "{prev}";', f'| "{prev}" | "{new}";')
edit(R + "courseAtoms.ts", f'    ...ES_{P}_ATOMS,\n', f'    ...ES_{P}_ATOMS,\n    ...ES_{N}_ATOMS,\n')
edit(R + "curriculum/es-quality.test.ts", f'import {{ ES_{P}_CHECKPOINT_INDEX }} from "./{prev}";\n', f'import {{ ES_{P}_CHECKPOINT_INDEX }} from "./{prev}";\nimport {{ ES_{N}_CHECKPOINT_INDEX }} from "./{new}";\n')
edit(R + "curriculum/es-quality.test.ts", f'  {prev}: ES_{P}_CHECKPOINT_INDEX,\n', f'  {prev}: ES_{P}_CHECKPOINT_INDEX,\n  {new}: ES_{N}_CHECKPOINT_INDEX,\n')
edit(R + "placementBank.ts", f'import {{ ES_{P}_PLACEMENT }} from "./curriculum/{prev}";\n', f'import {{ ES_{P}_PLACEMENT }} from "./curriculum/{prev}";\nimport {{ ES_{N}_PLACEMENT }} from "./curriculum/{new}";\n')
edit(R + "placementBank.ts", f'  ["{prev}", ES_{P}_PLACEMENT],\n', f'  ["{prev}", ES_{P}_PLACEMENT],\n  ["{new}", ES_{N}_PLACEMENT],\n')
print(f"registered {new} at 6 points")
