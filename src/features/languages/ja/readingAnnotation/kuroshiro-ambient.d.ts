// Minimal ambient types for kuroshiro + kuroshiro-analyzer-kuromoji.
// The packages ship no .d.ts; we only use a tiny slice of the API
// (`new Kuroshiro()`, `init(analyzer)`, `convert(str, { to })`),
// so a hand-rolled stub is cheaper than dragging in third-party types.

declare module "kuroshiro" {
  interface KuroshiroAnalyzer {
    init(): Promise<void>;
  }

  interface ConvertOptions {
    to?: "hiragana" | "katakana" | "romaji";
    mode?: "normal" | "spaced" | "okurigana" | "furigana";
    romajiSystem?: "nippon" | "passport" | "hepburn";
    delimiter_start?: string;
    delimiter_end?: string;
  }

  class Kuroshiro {
    init(analyzer: KuroshiroAnalyzer): Promise<void>;
    convert(str: string, options?: ConvertOptions): Promise<string>;
  }

  export default Kuroshiro;
}

declare module "kuroshiro-analyzer-kuromoji" {
  interface AnalyzerOptions {
    dictPath?: string;
  }

  class KuromojiAnalyzer {
    constructor(options?: AnalyzerOptions);
    init(): Promise<void>;
  }

  export default KuromojiAnalyzer;
}

// Deep internal import used ONLY by the native dict-loader patch in
// `kuroshiro.ts` (perf review 2026-09-17, lane A4b) — the package ships no
// types for this path.

declare module "kuromoji/src/loader/BrowserDictionaryLoader.js" {
  interface BrowserDictionaryLoaderCtor {
    prototype: {
      loadArrayBuffer: (
        url: string,
        callback: (err: unknown, buffer: ArrayBuffer | null) => void,
      ) => void;
    };
  }
  const BrowserDictionaryLoader: BrowserDictionaryLoaderCtor;
  export default BrowserDictionaryLoader;
}
