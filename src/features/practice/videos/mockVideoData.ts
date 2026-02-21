/** Mock transcript segment. In real impl, words could be tokenized at ingest. */
export type TranscriptSegment = {
  id: string;
  start: number;
  end: number;
  text: string;
  /** Pre-split words for click-to-add. Korean/Japanese may need tokenizer in real impl. */
  words: string[];
};

export type MockVideo = {
  id: string;
  title: string;
  languageId: string;
  duration: number;
  transcript: TranscriptSegment[];
};

/** Sample Korean greeting clip — mock data for demo. */
export const MOCK_VIDEO_KO: MockVideo = {
  id: "mock-ko-1",
  title: "Basic Greetings (Mock)",
  languageId: "ko",
  duration: 12,
  transcript: [
    { id: "s1", start: 0, end: 2, text: "안녕하세요", words: ["안녕하세요"] },
    { id: "s2", start: 2, end: 5, text: "저는 학생입니다", words: ["저는", "학생", "입니다"] },
    { id: "s3", start: 5, end: 8, text: "만나서 반갑습니다", words: ["만나서", "반갑습니다"] },
    { id: "s4", start: 8, end: 11, text: "오늘 날씨가 좋네요", words: ["오늘", "날씨가", "좋네요"] },
    { id: "s5", start: 11, end: 12, text: "감사합니다", words: ["감사합니다"] },
  ],
};
