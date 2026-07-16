# Spanish (es) A1 course spine — authoring contract

2026-07-13. Target: CEFR A1 (≈ JLPT N5 depth parity with the ja course's m3–m17 arc).
16 content modules × 8 lessons. LatAm-neutral Spanish. This doc is the coordination
backbone for parallel authoring: **vocab is pre-allocated per module** — an authoring
agent introduces exactly its module's allocation as atoms (`fromModule` = that module)
and may freely REUSE any surface allocated to an earlier module without re-registering it.

## Global style rules

- **Variety:** LatAm-neutral. `ustedes` for plural you (no `vosotros` drills — one culture
  note in m2 mentions Spain's vosotros). Vocabulary line: computadora, celular, jugo,
  carro, papa, boleto. Voice: `es-MX-DaliaNeural`.
- **Register:** teach `tú` as default, `usted` taught and drilled in m2 and used in
  service dialogues (restaurant/shop/hotel).
- **Orthography:** displayed Spanish always carries correct accents and ¿…? ¡…!.
  `acceptedAnswers` for translate steps should include accent-less variants of every
  accented answer (grading leniency until accent-aware grading ships).
- **Romanization field:** leave `romanization` unset (Latin script). `hint` may carry a
  pronunciation nudge for the tricky cases (ll, ñ, j, rr, gue/gui) in m1–m3 only.
- **Grammar teaching:** KO style — `infoStep(id, title, body, "grammar")`. No
  `grammar_rule` steps, no `grammarPointId` (reactive micro-teaching is phase 2).
- **Culture/flavor notes stay in-lesson** (info steps variant "culture", or
  `cultureNote` on phrase cards) — never in external docs.
- **Gender:** noun atoms carry `gender: "m" | "f"` (es-local atom field). Teach nouns
  WITH their article from m3 on (la casa, not casa) in phrase cards; atom surfaces are
  the bare noun (`casa`) so match grids stay single-word.
- **Lesson rhythm (8 lessons per module):** L1 teach-intro (info + phrase cards +
  first MCQs) · L2–L5 topic lessons mixing recognition→production (MCQ → match →
  cloze/build → translate) · L6 listening focus (sentence-level listening_comprehension
  + listening_build) · L7 integration dialogue (dialogue_listen or story-ish sequence +
  speaking) · L8 "M{n} Mastery Test" (graded steps only, no teach cards, samples the
  whole module). 6–9 steps per lesson, hard cap 25.
- **Ratchets that WILL fail you** (see house-style brief): passive card → same-atom
  graded step at i+2/i+3; no `explanation` on passive steps; explanation never contains
  ≥2-char chunks of the answer; from m5 up listening is sentence-level only;
  match_pairs sources single-word, grids ≥6 pairs; unique ids; every attributed atom's
  surface literally appears in that module's steps.

## Module spine

Format: **m{n} Title** — grammar · functions · NEW atoms (surface|gloss|kind[,gender]).
`part` = kind:"particle" (articles/preps/conjunctions live here so the particles slot
is non-empty). Phrases (multi-word) are kind:"phrase" and never enter match grids.

### m1 Sonidos y saludos — pronunciation & first words
Grammar: the 5 vowels; consonant friends & foes (ñ, ll, rr, j, h-silent, c/g soft-hard,
que/qui gue/gui); syllable stress basics (words ending vowel/n/s → penult). Functions:
greet, thank, apologize, say goodbye; numbers 0–10.
Atoms: hola|hello|vocab · adiós|goodbye|vocab · gracias|thank you|vocab ·
por favor|please|phrase · perdón|excuse me / sorry|vocab · sí|yes|vocab · no|no|vocab ·
buenos días|good morning|phrase · buenas tardes|good afternoon|phrase ·
buenas noches|good evening / night|phrase · hasta luego|see you later|phrase ·
mucho gusto|nice to meet you|phrase · cero|zero|vocab · uno|one|vocab · dos|two|vocab ·
tres|three|vocab · cuatro|four|vocab · cinco|five|vocab · seis|six|vocab ·
siete|seven|vocab · ocho|eight|vocab · nueve|nine|vocab · diez|ten|vocab ·
y|and|part · o|or|part
Note: m1 is exempt from the sentence-level listening ratchet (word-level OK, script-
acquisition-style), but prefer short phrases where natural.

### m2 Presentaciones — me llamo, ser (sg), tú/usted
Grammar: subject pronouns yo/tú/usted/él/ella; ser singular (soy/eres/es); me llamo /
te llamas / se llama; nationality adjectives m/f (mexicano/a, español/a...); tú vs
usted register (culture note: vosotros exists in Spain; this course uses ustedes).
Functions: introduce self/others, origin, nationality, occupation basics.
Atoms: yo|I|vocab · tú|you (informal)|vocab · usted|you (formal)|vocab · él|he|vocab ·
ella|she|vocab · ser|to be (identity)|vocab · soy|I am|vocab · eres|you are|vocab ·
es|he/she/it is|vocab · me llamo|my name is|phrase · ¿cómo te llamas?|what's your name?|phrase ·
de|of / from|part · señor|Mr. / sir|vocab,m · señora|Mrs. / ma'am|vocab,f ·
amigo|friend (m)|vocab,m · amiga|friend (f)|vocab,f · México|Mexico|vocab ·
España|Spain|vocab · Estados Unidos|United States|vocab · mexicano|Mexican (m)|vocab ·
mexicana|Mexican (f)|vocab · español|Spanish / Spaniard (m)|vocab ·
estadounidense|American|vocab · maestro|teacher (m)|vocab,m · maestra|teacher (f)|vocab,f ·
estudiante|student|vocab · doctor|doctor (m)|vocab,m · doctora|doctor (f)|vocab,f ·
¿de dónde eres?|where are you from?|phrase

### m3 Género y artículos — el/la, un/una, plurals, hay
Grammar: noun gender rules (-o/-a, common exceptions el día, la mano); definite
el/la/los/las; indefinite un/una/unos/unas; plural formation (-s/-es); hay = there is/are.
Functions: name everyday objects, say what's in a room/bag.
Atoms: el|the (m)|part · la|the (f)|part · los|the (m pl)|part · las|the (f pl)|part ·
un|a (m)|part · una|a (f)|part · casa|house|vocab,f · libro|book|vocab,m ·
mesa|table|vocab,f · silla|chair|vocab,f · puerta|door|vocab,f · ventana|window|vocab,f ·
teléfono|phone|vocab,m · celular|cell phone|vocab,m · computadora|computer|vocab,f ·
lápiz|pencil|vocab,m · pluma|pen|vocab,f · papel|paper|vocab,m · mochila|backpack|vocab,f ·
llave|key|vocab,f · dinero|money|vocab,m · agua|water|vocab,f · día|day|vocab,m ·
mano|hand|vocab,f · cosa|thing|vocab,f · hay|there is / there are|vocab ·
en|in / on / at|part · aquí|here|vocab

### m4 Descripciones — adjective agreement, ser + adj, colors
Grammar: adjective gender/number agreement (alto/alta/altos/altas; -e and consonant
adjectives invariant in gender); adjective placement after noun; muy; cognates.
Functions: describe people and things; colors.
Atoms: grande|big|vocab · pequeño|small (m)|vocab · alto|tall (m)|vocab ·
bajo|short (height) (m)|vocab · bonito|pretty (m)|vocab · feo|ugly (m)|vocab ·
nuevo|new (m)|vocab · viejo|old (m)|vocab · bueno|good (m)|vocab · malo|bad (m)|vocab ·
fácil|easy|vocab · difícil|difficult|vocab · interesante|interesting|vocab ·
inteligente|intelligent|vocab · simpático|nice / friendly (m)|vocab · muy|very|vocab ·
rojo|red (m)|vocab · azul|blue|vocab · verde|green|vocab · amarillo|yellow (m)|vocab ·
negro|black (m)|vocab · blanco|white (m)|vocab · color|color|vocab,m ·
carro|car|vocab,m · perro|dog|vocab,m · gato|cat|vocab,m · pero|but|part
Note: feminine/plural forms are taught as agreement patterns in steps, not separate atoms.

### m5 Familia y posesión — family, possessives, tener (sg)
Grammar: possessives mi/mis, tu/tus, su/sus; possession with de (el carro de Ana);
tener singular (tengo/tienes/tiene); tener X años (age). Functions: present your
family, say age, express possession.
Atoms: familia|family|vocab,f · madre|mother|vocab,f · padre|father|vocab,m ·
mamá|mom|vocab,f · papá|dad|vocab,m · hermano|brother|vocab,m · hermana|sister|vocab,f ·
hijo|son|vocab,m · hija|daughter|vocab,f · abuelo|grandfather|vocab,m ·
abuela|grandmother|vocab,f · esposo|husband|vocab,m · esposa|wife|vocab,f ·
niño|boy / child|vocab,m · niña|girl|vocab,f · tener|to have|vocab · tengo|I have|vocab ·
tienes|you have|vocab · tiene|he/she has|vocab · mi|my|part · tu|your (informal)|part ·
su|his / her / your (formal)|part · año|year|vocab,m · años|years|vocab ·
¿cuántos años tienes?|how old are you?|phrase · quién|who|vocab · también|also|vocab

### m6 Números y tiempo — 11–100, clock time, days, months
Grammar: numbers 11–100 (dieciséis pattern, veintiuno, y in 31+); ¿qué hora es? / es la
una / son las dos y media; days (lowercase, el lunes = on Monday); months & dates.
Functions: count, tell time, give dates and schedules.
Atoms: once|eleven|vocab · doce|twelve|vocab · trece|thirteen|vocab ·
catorce|fourteen|vocab · quince|fifteen|vocab · veinte|twenty|vocab ·
treinta|thirty|vocab · cuarenta|forty|vocab · cincuenta|fifty|vocab ·
sesenta|sixty|vocab · setenta|seventy|vocab · ochenta|eighty|vocab ·
noventa|ninety|vocab · cien|one hundred|vocab · hora|hour / time|vocab,f ·
minuto|minute|vocab,m · media|half (past)|vocab · cuarto|quarter|vocab,m ·
lunes|Monday|vocab,m · martes|Tuesday|vocab,m · miércoles|Wednesday|vocab,m ·
jueves|Thursday|vocab,m · viernes|Friday|vocab,m · sábado|Saturday|vocab,m ·
domingo|Sunday|vocab,m · semana|week|vocab,f · mes|month|vocab,m · hoy|today|vocab ·
mañana|tomorrow / morning|vocab · enero|January|vocab,m · ¿qué hora es?|what time is it?|phrase

### m7 Estar y lugares — estar, location, ser vs estar, al/del
Grammar: estar full singular + estamos/están; location with en; prepositions cerca de /
lejos de / al lado de / delante de / detrás de; contractions al/del; ser vs estar first
contrast (identity vs location/state); estar + feelings (bien, cansado, contento).
Functions: say where things/people are, how you feel; ask where places are.
Atoms: estar|to be (location/state)|vocab · estoy|I am (state)|vocab ·
estás|you are (state)|vocab · está|he/she/it is (state)|vocab ·
estamos|we are (state)|vocab · están|they are (state)|vocab · dónde|where|vocab ·
ciudad|city|vocab,f · calle|street|vocab,f · tienda|store|vocab,f · banco|bank|vocab,m ·
parque|park|vocab,m · escuela|school|vocab,f · restaurante|restaurant|vocab,m ·
baño|bathroom|vocab,m · hotel|hotel|vocab,m · aeropuerto|airport|vocab,m ·
cerca|near|vocab · lejos|far|vocab · al lado de|next to|phrase · a|to / at|part ·
al|to the (m)|part · del|of the (m)|part · bien|well / fine|vocab · mal|badly|vocab ·
cansado|tired (m)|vocab · contento|happy (m)|vocab · enfermo|sick (m)|vocab

### m8 Rutinas I — regular -ar present (full paradigm)
Grammar: -ar present all six persons (hablo/hablas/habla/hablamos/hablan + vosotros
shown once in a table note, never drilled); frequency adverbs (siempre, a veces, nunca);
nosotros = we. Functions: talk about daily activities and habits.
Atoms: hablar|to speak|vocab · trabajar|to work|vocab · estudiar|to study|vocab ·
comprar|to buy|vocab · caminar|to walk|vocab · escuchar|to listen|vocab ·
mirar|to look at / watch|vocab · cocinar|to cook|vocab · bailar|to dance|vocab ·
cantar|to sing|vocab · descansar|to rest|vocab · llegar|to arrive|vocab ·
necesitar|to need|vocab · usar|to use|vocab · nosotros|we|vocab · ellos|they (m)|vocab ·
ellas|they (f)|vocab · ustedes|you all|vocab · siempre|always|vocab ·
a veces|sometimes|phrase · nunca|never|vocab · todos los días|every day|phrase ·
mucho|a lot|vocab · poco|a little|vocab ·
inglés|English (language)|vocab,m · música|music|vocab,f
(REUSE, do not re-register: `español` is already an m2 atom — teach the language
sense in m8 steps without adding a duplicate atom.)

### m9 Rutinas II — -er/-ir present, question words
Grammar: -er/-ir present paradigms (como/comes/come/comemos/comen; vivo/vives...);
full interrogative set (qué, dónde, cuándo, quién, cómo, cuánto, por qué, cuál);
question intonation + inversion; porque answers.
Functions: ask and answer everyday questions.
Atoms: comer|to eat|vocab · beber|to drink|vocab · leer|to read|vocab ·
aprender|to learn|vocab · comprender|to understand|vocab · correr|to run|vocab ·
vender|to sell|vocab · vivir|to live|vocab · escribir|to write|vocab ·
abrir|to open|vocab · recibir|to receive|vocab · qué|what|vocab · cuándo|when|vocab ·
cómo|how|vocab · cuánto|how much|vocab · cuál|which|vocab · por qué|why|phrase ·
porque|because|part · comida|food|vocab,f · carta|letter|vocab,f ·
periódico|newspaper|vocab,m · apartamento|apartment|vocab,m · con|with|part · sin|without|part

### m10 Comida y gustos — gustar, food, ordering
Grammar: gustar mechanics (me/te/le/nos/les gusta + sg noun/infinitive, gustan + pl);
querer for requests (quiero + noun/inf); polite ordering (quisiera, para mí, la cuenta).
Functions: express likes/dislikes, order food and drink.
Atoms: gustar|to be pleasing (to like)|vocab · me gusta|I like|phrase ·
te gusta|you like|phrase · le gusta|he/she likes|phrase · querer|to want|vocab ·
quiero|I want|vocab · quisiera|I would like|vocab · café|coffee|vocab,m · té|tea|vocab,m ·
jugo|juice|vocab,m · leche|milk|vocab,f · cerveza|beer|vocab,f · pan|bread|vocab,m ·
queso|cheese|vocab,m · pollo|chicken|vocab,m · carne|meat|vocab,f ·
pescado|fish (food)|vocab,m · arroz|rice|vocab,m · huevo|egg|vocab,m · sopa|soup|vocab,f ·
ensalada|salad|vocab,f · fruta|fruit|vocab,f · manzana|apple|vocab,f ·
naranja|orange|vocab,f · desayuno|breakfast|vocab,m · almuerzo|lunch|vocab,m ·
cena|dinner|vocab,f · la cuenta|the check|phrase · rico|delicious (m)|vocab ·
tengo hambre|I'm hungry|phrase · tengo sed|I'm thirsty|phrase

### m11 Vamos — ir, ir + a + infinitive, transport
Grammar: ir (voy/vas/va/vamos/van); ir a + place; ir a + infinitive = near future;
vamos a = let's; means of transport (en carro / a pie).
Functions: say where you're going and what you're going to do; make plans.
Atoms: ir|to go|vocab · voy|I go|vocab · vas|you go|vocab · va|he/she goes|vocab ·
vamos|we go / let's go|vocab · van|they go|vocab · viaje|trip|vocab,m ·
autobús|bus|vocab,m · tren|train|vocab,m · avión|airplane|vocab,m · metro|subway|vocab,m ·
taxi|taxi|vocab,m · bicicleta|bicycle|vocab,f · a pie|on foot|phrase ·
boleto|ticket|vocab,m · playa|beach|vocab,f · cine|movie theater|vocab,m ·
museo|museum|vocab,m · iglesia|church|vocab,f · mercado|market|vocab,m ·
centro|downtown|vocab,m · trabajo|work / job|vocab,m · fiesta|party|vocab,f ·
este fin de semana|this weekend|phrase · después|after / later|vocab · ahora|now|vocab ·
esta noche|tonight|phrase

### m12 De compras — demonstratives, prices, clothes
Grammar: demonstratives este/esta/estos/estas, ese/esa/esos/esas; ¿cuánto cuesta(n)?;
costar o→ue preview (cuesta only); llevar/buscar/pagar; numbers to thousands (price
patterns: cien, doscientos, mil).
Functions: shop, ask prices, compare (más ... que intro).
Atoms: este|this (m)|part · esta|this (f)|part · ese|that (m)|part · esa|that (f)|part ·
cuesta|it costs|vocab · peso|peso|vocab,m · dólar|dollar|vocab,m · precio|price|vocab,m ·
caro|expensive (m)|vocab · barato|cheap (m)|vocab · ropa|clothing|vocab,f ·
camisa|shirt|vocab,f · camiseta|t-shirt|vocab,f · pantalones|pants|vocab,m ·
zapatos|shoes|vocab,m · vestido|dress|vocab,m · falda|skirt|vocab,f ·
chaqueta|jacket|vocab,f · sombrero|hat|vocab,m · llevar|to wear / carry|vocab ·
buscar|to look for|vocab · pagar|to pay|vocab · tarjeta|card|vocab,f ·
efectivo|cash|vocab,m · más|more|vocab · menos|less|vocab · que|than / that|part ·
doscientos|two hundred|vocab · mil|one thousand|vocab · ¿cuánto cuesta?|how much does it cost?|phrase

### m13 Cambios de raíz — stem-changing verbs
Grammar: e→ie (querer full, preferir, pensar, empezar, entender); o→ue (poder, dormir,
volver, almorzar, costar); e→i (pedir, servir); nosotros keeps the stem (queremos).
Functions: preferences, abilities, polite requests (¿puedo...?, ¿puedes...?).
Atoms: preferir|to prefer|vocab · pensar|to think|vocab · empezar|to begin|vocab ·
entender|to understand|vocab · cerrar|to close|vocab · poder|to be able to|vocab ·
puedo|I can|vocab · puedes|you can|vocab · dormir|to sleep|vocab · volver|to return|vocab ·
almorzar|to have lunch|vocab · pedir|to ask for / order|vocab · servir|to serve|vocab ·
jugar|to play (a game/sport)|vocab · partido|game / match|vocab,m ·
fútbol|soccer|vocab,m · deporte|sport|vocab,m · película|movie|vocab,f ·
libro favorito|favorite book|phrase · favorito|favorite (m)|vocab · idea|idea|vocab,f ·
temprano|early|vocab · tarde|late / afternoon|vocab,f · ¿puedo pasar?|may I come in?|phrase

### m14 Casa y clima — home, hay vs está, weather
Grammar: hay (existence) vs está/están (location) contrast; hace + weather (hace calor/
frío/sol/viento); llueve/nieva; seasons; está + gerund preview NOT here (m16).
Functions: describe your home; talk about weather and seasons.
Atoms: cocina|kitchen|vocab,f · sala|living room|vocab,f · dormitorio|bedroom|vocab,m ·
comedor|dining room|vocab,m · jardín|garden|vocab,m · piso|floor|vocab,m ·
cama|bed|vocab,f · sofá|sofa|vocab,m · lámpara|lamp|vocab,f ·
refrigerador|refrigerator|vocab,m · estufa|stove|vocab,f · televisión|television|vocab,f ·
cuadro|picture / painting|vocab,m · clima|weather / climate|vocab,m · sol|sun|vocab,m ·
lluvia|rain|vocab,f · viento|wind|vocab,m · nieve|snow|vocab,f · calor|heat|vocab,m ·
frío|cold|vocab,m · llueve|it rains|vocab · nieva|it snows|vocab ·
hace calor|it's hot|phrase · hace frío|it's cold|phrase · primavera|spring|vocab,f ·
verano|summer|vocab,m · otoño|fall|vocab,m · invierno|winter|vocab,m

### m15 Mi rutina — reflexives, daily narrative
Grammar: reflexive pronouns me/te/se/nos; levantarse, despertarse (e→ie), ducharse,
bañarse, vestirse (e→i), acostarse (o→ue), lavarse los dientes; sequencing (primero,
luego, después, por la mañana/tarde/noche); reflexive vs non-reflexive (lavar vs lavarse).
Functions: narrate your day start to finish.
Atoms: levantarse|to get up|vocab · despertarse|to wake up|vocab ·
ducharse|to shower|vocab · bañarse|to bathe|vocab · vestirse|to get dressed|vocab ·
acostarse|to go to bed|vocab · lavarse|to wash (oneself)|vocab ·
cepillarse|to brush (hair/teeth)|vocab · me levanto|I get up|phrase ·
se levanta|he/she gets up|phrase · diente|tooth|vocab,m · pelo|hair|vocab,m ·
cara|face|vocab,f · primero|first|vocab · luego|then|vocab ·
por la mañana|in the morning|phrase · por la tarde|in the afternoon|phrase ·
por la noche|at night|phrase · antes de|before|phrase · después de|after|phrase ·
rutina|routine|vocab,f · desayunar|to have breakfast|vocab · salir|to leave / go out|vocab ·
salgo|I leave|vocab

### m16 De viaje — survival Spanish, yo-irregulars, progressive, grand review
Grammar: yo-irregulars (hago, salgo, vengo, sé, conozco — as vocabulary, light touch);
saber vs conocer intro; present progressive estar + -ando/-iendo; hotel & directions
survival (siga derecho, a la derecha/izquierda as fixed phrases); A1 grand review
weaving m1–m15 (L5–L7 are cumulative review lessons, L8 is the course mastery test).
Atoms: hacer|to do / make|vocab · hago|I do / make|vocab · venir|to come|vocab ·
vengo|I come|vocab · saber|to know (facts)|vocab · sé|I know|vocab ·
conocer|to know (people/places)|vocab · conozco|I know (am familiar with)|vocab ·
maleta|suitcase|vocab,f · pasaporte|passport|vocab,m · reservación|reservation|vocab,f ·
habitación|room (hotel)|vocab,f · derecha|right (side)|vocab,f · izquierda|left|vocab,f ·
derecho|straight ahead|vocab · esquina|corner|vocab,f · mapa|map|vocab,m ·
ayuda|help|vocab,f · ¿me puede ayudar?|can you help me?|phrase ·
estoy aprendiendo|I am learning|phrase · hablando|speaking|vocab ·
comiendo|eating|vocab · no entiendo|I don't understand|phrase ·
¿habla inglés?|do you speak English?|phrase · más despacio|more slowly|phrase

## Conjugation tables (es/conjugationTables.ts)

Seed verbs (each ≥18 forms: presente 6 + pretérito 6 + imperfecto 6, keys like
`present.yo`, `preterite.tu`, `imperfect.nosotros`; vosotros included in data for
completeness, flagged in labels): hablar, comer, vivir, ser, estar, ir, tener, querer,
poder, hacer. `introducedAtModule` per spine. Preterite/imperfect are TRAINER data
(A2 preview) — the A1 course itself drills present only.

## Placement bank

Screener: 1 item per module m1–m16 (16 items, ordered easy→hard). byModule: 4 items
per module testing that module's core grammar. All via grammarHelpers factories.

## Reading passages / speaking prompts

- 8 reading passages, levels 1–4 (2 per level): self-intro, family, my house, daily
  routine, at the restaurant, weekend plans, shopping trip, travel day. 3 MCQs each.
- ~24 speaking prompts: echo mode m1–m8 phrases, response mode m9+ (e.g. "¿Cómo te
  llamas?" → answer pattern).

## Deliberately out of scope (noted, not built)

- ConjugationGrid trainer (person×tense matrix UI) + AgreementCloze step type —
  the two Romance engines from the scoping doc. Course data is authored so both can
  light up later (gender on atoms, full conjugation tables).
- Accent-aware grading mode (accept-but-flag missing accents). Interim: accentless
  variants in acceptedAnswers.
- Reactive grammar micro-teaching (grammar_rule + es-grammar-points.json).
- Alphabet trainer config (m1 teaches pronunciation in-lesson instead).
- Sidequests, stories, kanji-analog, counters (N/A), derived test-outs (ja-only).
