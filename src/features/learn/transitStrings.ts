/**
 * Per-target-language signage strings for the transit-map learn homepage.
 * Deliberately not i18next: the map's signage is themed to the language
 * being learned (like real station signage), not the UI language.
 */
export type TransitStrings = {
  lineName: string;
  /** N4-tier line name (only meaningful for courses with n4 content). */
  n4LineName: string;
  youAreHere: string;
  zones: string[];
  /** One short blurb per zone (thirds), shown on zone hover in the list. */
  zoneDescriptions: string[];
  numerals: string[];
  mapTitle: string;
  seal: string;
  depot: string;
  departuresBoard: string;
  doneStamp: string;
  recapBadge: string;
  stampRally: string;
  viewNetworkMap: string;
  hideNetworkMap: string;
  noModulesTitle: string;
  noModulesBody: string;
};

const STRINGS: Record<string, TransitStrings> = {
  ja: {
    lineName: "本線 Main Line",
    n4LineName: "N4線 N4 Line",
    youAreHere: "現在地 YOU ARE HERE",
    zones: ["ZONE 1 · はじまり", "ZONE 2 · 日常", "ZONE 3 · 出発"],
    zoneDescriptions: [
      "Foundations — kana, first words, and how Japanese sentences fit together.",
      "Everyday Japanese — daily-life vocabulary, particles, and practical grammar.",
      "Setting off — past tense, conjugation, and everything that rounds out N5.",
    ],
    numerals: ["一", "二", "三"],
    mapTitle: "学習路線図",
    seal: "済",
    depot: "車両基地 Practice Depot →",
    departuresBoard: "Lessons · 発車標",
    doneStamp: "済",
    recapBadge: "復",
    stampRally: "スタンプラリー · Side quests",
    viewNetworkMap: "全体図 · View network map",
    hideNetworkMap: "Hide network map",
    noModulesTitle: "No lessons on this line yet",
    noModulesBody: "This course's route is still being built. Check back soon.",
  },
  ko: {
    lineName: "본선 Main Line",
    n4LineName: "N4선 N4 Line",
    youAreHere: "현 위치 YOU ARE HERE",
    zones: ["ZONE 1 · 시작", "ZONE 2 · 일상", "ZONE 3 · 출발"],
    zoneDescriptions: [
      "Foundations — Hangul, first words, and the basic shape of a Korean sentence.",
      "Everyday Korean — daily vocabulary, particles, and core grammar.",
      "Setting off — tenses, conjugation, and rounding out the beginner course.",
    ],
    numerals: ["일", "이", "삼"],
    mapTitle: "학습 노선도",
    seal: "완",
    depot: "차량기지 Practice Depot →",
    departuresBoard: "Lessons · 출발 안내",
    doneStamp: "완",
    recapBadge: "복",
    stampRally: "스탬프 랠리 · Side quests",
    viewNetworkMap: "전체 노선도 · View network map",
    hideNetworkMap: "Hide network map",
    noModulesTitle: "No lessons on this line yet",
    noModulesBody: "This course's route is still being built. Check back soon.",
  },
  es: {
    lineName: "Línea principal",
    n4LineName: "Línea N4",
    youAreHere: "¡ESTÁS AQUÍ!",
    zones: ["ZONA 1 · Fundamentos", "ZONA 2 · Vida diaria", "ZONA 3 · De viaje"],
    zoneDescriptions: [
      "Foundations — first words, greetings, and how a Spanish sentence works.",
      "Everyday Spanish — daily vocabulary and practical grammar.",
      "Setting off — tenses, conjugation, and travel-ready phrases.",
    ],
    numerals: ["1", "2", "3"],
    mapTitle: "Mapa de la línea",
    seal: "✓",
    depot: "Depósito · Práctica →",
    departuresBoard: "Lecciones · Salidas",
    doneStamp: "✓",
    recapBadge: "R",
    stampRally: "Rally de sellos · Misiones",
    viewNetworkMap: "Ver mapa de la red",
    hideNetworkMap: "Ocultar mapa",
    noModulesTitle: "Aún no hay lecciones en esta línea",
    noModulesBody: "La ruta de este curso todavía se está construyendo. Vuelve pronto.",
  },
};

export const stringsFor = (lang: string): TransitStrings =>
  STRINGS[lang] ?? STRINGS.es;

/**
 * Shared learn-page header subtitle. Identical across the map (Path) and
 * list views so the header never changes text when toggling between them.
 */
export const LEARN_HEADER_SUBTITLE =
  "Modules, lessons, and side quests — pick up where you left off";
