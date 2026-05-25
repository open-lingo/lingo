import type { SpeakingPrompt } from "./ja-speaking-prompts";

export const KO_SPEAKING_PROMPTS: SpeakingPrompt[] = [
  { id: "ko-echo-1", targetPhrase: "안녕하세요", translation: "Hello", mode: "echo", minModule: 1 },
  { id: "ko-echo-2", targetPhrase: "감사합니다", translation: "Thank you", mode: "echo", minModule: 1 },
  { id: "ko-echo-3", targetPhrase: "죄송합니다", translation: "I'm sorry", mode: "echo", minModule: 1 },
  { id: "ko-echo-4", targetPhrase: "물 주세요", translation: "Water, please", mode: "echo", minModule: 2 },
  { id: "ko-echo-5", targetPhrase: "이거 얼마예요?", translation: "How much is this?", mode: "echo", minModule: 2 },
  { id: "ko-echo-6", targetPhrase: "화장실이 어디예요?", translation: "Where is the restroom?", mode: "echo", minModule: 2 },
  { id: "ko-echo-7", targetPhrase: "맛있어요", translation: "It's delicious", mode: "echo", minModule: 3 },
  { id: "ko-echo-8", targetPhrase: "한국어를 공부해요", translation: "I study Korean", mode: "echo", minModule: 3 },
  { id: "ko-resp-1", targetPhrase: "네, 학생이에요", translation: "Yes, I'm a student", mode: "response", minModule: 2 },
  { id: "ko-resp-2", targetPhrase: "천 원이에요", translation: "It's 1000 won", mode: "response", minModule: 3 },
];
