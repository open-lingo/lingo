/**
 * Spanish speaking prompts — 24 prompts per the ES spine
 * (docs/es-course-spine-2026-07-13.md §Reading passages / speaking prompts).
 *
 * Echo mode covers m1–m8 phrases (repeat what you hear); response mode
 * covers m9+ (hear the question in `promptAudio`, produce the answer
 * pattern in `targetPhrase`). `minModule` gates each prompt to the module
 * whose vocabulary/grammar it needs — the LATEST module any word in the
 * prompt or the target comes from (spine allocation order).
 */
import type { SpeakingPrompt } from "./ja-speaking-prompts";

export const ES_SPEAKING_PROMPTS: SpeakingPrompt[] = [
  // ─── Echo mode (m1–m8) ──────────────────────────────────────────────────
  { id: "es-echo-1", targetPhrase: "hola", translation: "Hello", mode: "echo", minModule: 1 },
  { id: "es-echo-2", targetPhrase: "buenos días", translation: "Good morning", mode: "echo", minModule: 1 },
  { id: "es-echo-3", targetPhrase: "gracias", translation: "Thank you", mode: "echo", minModule: 1 },
  { id: "es-echo-4", targetPhrase: "mucho gusto", translation: "Nice to meet you", mode: "echo", minModule: 1 },
  { id: "es-echo-5", targetPhrase: "me llamo Ana", translation: "My name is Ana", mode: "echo", minModule: 2 },
  { id: "es-echo-6", targetPhrase: "¿de dónde eres?", translation: "Where are you from?", mode: "echo", minModule: 2 },
  { id: "es-echo-7", targetPhrase: "hay dos libros en la mesa", translation: "There are two books on the table", mode: "echo", minModule: 3 },
  { id: "es-echo-8", targetPhrase: "la casa es grande y bonita", translation: "The house is big and pretty", mode: "echo", minModule: 4 },
  { id: "es-echo-9", targetPhrase: "tengo dos hermanos", translation: "I have two brothers", mode: "echo", minModule: 5 },
  { id: "es-echo-10", targetPhrase: "¿qué hora es?", translation: "What time is it?", mode: "echo", minModule: 6 },
  { id: "es-echo-11", targetPhrase: "el baño está cerca de la puerta", translation: "The bathroom is near the door", mode: "echo", minModule: 7 },
  { id: "es-echo-12", targetPhrase: "hablo español todos los días", translation: "I speak Spanish every day", mode: "echo", minModule: 8 },
  // ─── Response mode (m9+) — hear the question, produce the answer ───────
  { id: "es-resp-1", targetPhrase: "vivo en un apartamento", translation: "I live in an apartment", mode: "response", promptAudio: "¿dónde vives?", minModule: 9 },
  { id: "es-resp-2", targetPhrase: "como pan y huevos", translation: "I eat bread and eggs", mode: "response", promptAudio: "¿qué comes en el desayuno?", minModule: 10 },
  { id: "es-resp-3", targetPhrase: "sí, me gusta el café", translation: "Yes, I like coffee", mode: "response", promptAudio: "¿te gusta el café?", minModule: 10 },
  { id: "es-resp-4", targetPhrase: "quiero café, por favor", translation: "I want coffee, please", mode: "response", promptAudio: "¿café o té?", minModule: 10 },
  { id: "es-resp-5", targetPhrase: "sí, voy al cine esta noche", translation: "Yes, I'm going to the movies tonight", mode: "response", promptAudio: "¿vas al cine esta noche?", minModule: 11 },
  { id: "es-resp-6", targetPhrase: "cuesta veinte pesos", translation: "It costs twenty pesos", mode: "response", promptAudio: "¿cuánto cuesta la camiseta?", minModule: 12 },
  { id: "es-resp-7", targetPhrase: "prefiero la película", translation: "I prefer the movie", mode: "response", promptAudio: "¿prefieres el libro o la película?", minModule: 13 },
  { id: "es-resp-8", targetPhrase: "hay una mesa y una estufa", translation: "There is a table and a stove", mode: "response", promptAudio: "¿qué hay en la cocina?", minModule: 14 },
  { id: "es-resp-9", targetPhrase: "sí, hace frío y llueve", translation: "Yes, it's cold and it's raining", mode: "response", promptAudio: "¿hace frío hoy?", minModule: 14 },
  { id: "es-resp-10", targetPhrase: "me levanto a las siete", translation: "I get up at seven", mode: "response", promptAudio: "¿a qué hora te levantas?", minModule: 15 },
  { id: "es-resp-11", targetPhrase: "sí, hablo inglés", translation: "Yes, I speak English", mode: "response", promptAudio: "¿habla inglés?", minModule: 16 },
  { id: "es-resp-12", targetPhrase: "está a la derecha, en la esquina", translation: "It's on the right, on the corner", mode: "response", promptAudio: "¿dónde está el banco?", minModule: 16 },
];
