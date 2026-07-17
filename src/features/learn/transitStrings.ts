/**
 * Per-target-language signage strings for the transit-map learn homepage.
 * Deliberately not i18next: the map's signage is themed to the language
 * being learned (like real station signage), not the UI language.
 */
export type TransitStrings = {
  lineName: string;
  youAreHere: string;
  zones: string[];
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
};

const STRINGS: Record<string, TransitStrings> = {
  ja: {
    lineName: "本線 Main Line",
    youAreHere: "現在地 YOU ARE HERE",
    zones: ["ZONE 1 · はじまり", "ZONE 2 · 日常", "ZONE 3 · 出発"],
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
  },
  ko: {
    lineName: "본선 Main Line",
    youAreHere: "현 위치 YOU ARE HERE",
    zones: ["ZONE 1 · 시작", "ZONE 2 · 일상", "ZONE 3 · 출발"],
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
  },
  es: {
    lineName: "Línea principal",
    youAreHere: "¡ESTÁS AQUÍ!",
    zones: ["ZONA 1 · Fundamentos", "ZONA 2 · Vida diaria", "ZONA 3 · De viaje"],
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
