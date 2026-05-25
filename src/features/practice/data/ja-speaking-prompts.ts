export type SpeakingPrompt = {
  id: string;
  targetPhrase: string;
  translation: string;
  mode: "echo" | "response";
  promptAudio?: string;
  minModule: number;
};

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  { id: "sp-sumimasen", targetPhrase: "すみません", translation: "Excuse me", mode: "echo", minModule: 3 },
  { id: "sp-arigatou", targetPhrase: "ありがとうございます", translation: "Thank you", mode: "echo", minModule: 3 },
  { id: "sp-kore-wa-nan", targetPhrase: "これは なんですか", translation: "What is this?", mode: "echo", minModule: 4 },
  { id: "sp-mizu-kudasai", targetPhrase: "みずを ください", translation: "Water, please", mode: "echo", minModule: 5 },
  { id: "sp-ikura", targetPhrase: "いくらですか", translation: "How much is it?", mode: "echo", minModule: 5 },
  { id: "sp-eki-doko", targetPhrase: "えきは どこですか", translation: "Where is the station?", mode: "echo", minModule: 6 },
  { id: "sp-tabemasu", targetPhrase: "ラーメンを たべます", translation: "I eat ramen", mode: "echo", minModule: 7 },
  { id: "sp-nomimasu", targetPhrase: "コーヒーを のみます", translation: "I drink coffee", mode: "echo", minModule: 7 },
  { id: "sp-resp-nandesuka", targetPhrase: "ほんです", translation: "It's a book", mode: "response", promptAudio: "これは なんですか", minModule: 4 },
  { id: "sp-resp-ikura", targetPhrase: "ひゃくえんです", translation: "It's 100 yen", mode: "response", promptAudio: "いくらですか", minModule: 5 },
];
