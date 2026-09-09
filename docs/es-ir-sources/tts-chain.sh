#!/bin/zsh
# zsh tts-chain.sh <tag>  — emit ES deck → edge TTS → manifest → copy manifest + new mp3s into tts-publish/es
set -e
S=${0:A:h}; TAG=$1
L=/Users/lichfield/Documents/projects/lingle/lingo; D=/Users/lichfield/Documents/projects/lingle/lingo-data
python3 -c "import json,re;h=json.load(open('$L/src/shared/tts/manifests/es.json'))['hashes'];print('\n'.join(re.findall('.{16}',h)))" | sort > $S/tts-old-$TAG.txt
cd $L && EMIT_ES_TTS_DECK=1 npx vitest run src/features/languages/es/__tests__/emitTtsDeck.test.ts 2>&1 | grep -E "Tests |wrote|deck" | head -3
cd $D && .venv/bin/python -m pipeline.tts.generate --provider edge --lang es 2>&1 | tail -3
.venv/bin/python -m pipeline.tts.emit_manifest 2>&1 | tail -2
cp out/tts/manifest/es.json $L/src/shared/tts/manifests/es.json
python3 -c "import json,re;h=json.load(open('$L/src/shared/tts/manifests/es.json'))['hashes'];print('\n'.join(re.findall('.{16}',h)))" | sort > $S/tts-new-$TAG.txt
comm -13 $S/tts-old-$TAG.txt $S/tts-new-$TAG.txt > $S/tts-added-$TAG.txt
n=0; while read h; do [[ -n $h ]] || continue; cp $D/out/tts/es/$h.mp3 $L/tts-publish/es/$h.mp3 && n=$((n+1)); done < $S/tts-added-$TAG.txt
echo "TTS_CHAIN_DONE added=$(wc -l < $S/tts-added-$TAG.txt) copied=$n manifest_count=$(python3 -c "import json;print(json.load(open('$L/src/shared/tts/manifests/es.json'))['count'])")"
