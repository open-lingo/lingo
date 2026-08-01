/**
 * Spanish reading passages — 8 passages, levels 1–4 (two per level),
 * per the ES spine (docs/es-course-spine-2026-07-13.md §Reading passages).
 *
 * Level ≈ how far into the course the reader is (level 1 ≈ m1–m4 vocab,
 * level 2 ≈ m1–m8, level 3 ≈ m1–m12, level 4 ≈ m1–m16). Passage Spanish
 * stays within the spine's cumulative vocabulary at that level; verb
 * forms stay within taught paradigms (present tense only — the A1 course
 * drills no past tenses). Questions and options are English, 4 options
 * each, 3 questions per passage (ja/ko house shape).
 *
 * Consumed only by emitTtsDeck.test.ts (env-gated ES TTS deck emitter) —
 * the comprehension-passage practice page these were authored for was
 * removed in favor of the story library (features/practice/stories/).
 */
export type EsReadingOption = {
  id: string;
  text: string;
};

export type EsReadingQuestion = {
  id: string;
  prompt: string;
  options: EsReadingOption[];
  correctOptionId: string;
  explanation?: string;
};

export type EsReadingPassage = {
  id: string;
  level: number;
  contextHint?: string;
  passage: string;
  questions: EsReadingQuestion[];
  topic: "daily" | "travel" | "school" | "work" | "food";
};

export const ES_READING_PASSAGES: EsReadingPassage[] = [
  // ─── Level 1 — self-intro (m1–m2 vocab) ─────────────────────────────────
  {
    id: "es-l1-selfintro",
    level: 1,
    contextHint: "Sofía introduces herself",
    topic: "daily",
    passage:
      "¡Hola! ¡Buenos días!\nMe llamo Sofía.\nSoy de México. Soy mexicana.\nSoy maestra.\n¡Mucho gusto!",
    questions: [
      {
        id: "q1",
        prompt: "What is her name?",
        options: [
          { id: "a", text: "Ana" },
          { id: "b", text: "Sofía" },
          { id: "c", text: "María" },
          { id: "d", text: "Lucía" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "Where is she from?",
        options: [
          { id: "a", text: "Spain" },
          { id: "b", text: "The United States" },
          { id: "c", text: "Mexico" },
          { id: "d", text: "Colombia" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        prompt: "What is her job?",
        options: [
          { id: "a", text: "Teacher" },
          { id: "b", text: "Doctor" },
          { id: "c", text: "Student" },
          { id: "d", text: "Cook" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  // ─── Level 1 — family (m1–m5 vocab) ─────────────────────────────────────
  {
    id: "es-l1-family",
    level: 1,
    contextHint: "Diego's family",
    topic: "daily",
    passage:
      "Me llamo Diego.\nTengo una familia grande.\nMi madre es doctora y mi padre es maestro.\nTengo dos hermanas y un hermano.\nMi hermano tiene diez años.",
    questions: [
      {
        id: "q1",
        prompt: "How many sisters does Diego have?",
        options: [
          { id: "a", text: "One" },
          { id: "b", text: "Two" },
          { id: "c", text: "Three" },
          { id: "d", text: "None" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "What is his mother's job?",
        options: [
          { id: "a", text: "Teacher" },
          { id: "b", text: "Student" },
          { id: "c", text: "Doctor" },
          { id: "d", text: "Nurse" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        prompt: "How old is his brother?",
        options: [
          { id: "a", text: "Ten" },
          { id: "b", text: "Eight" },
          { id: "c", text: "Twelve" },
          { id: "d", text: "Five" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  // ─── Level 2 — my house (m1–m8 vocab) ───────────────────────────────────
  {
    id: "es-l2-house",
    level: 2,
    contextHint: "A small house near a park",
    topic: "daily",
    passage:
      "Mi casa es pequeña pero bonita.\nHay dos mesas y cuatro sillas.\nMi computadora está en la mesa.\nLa casa está cerca de un parque.\nCamino en el parque todos los días.",
    questions: [
      {
        id: "q1",
        prompt: "What is the house like?",
        options: [
          { id: "a", text: "Big and new" },
          { id: "b", text: "Small but pretty" },
          { id: "c", text: "Old and ugly" },
          { id: "d", text: "Big but old" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "Where is the computer?",
        options: [
          { id: "a", text: "On the chair" },
          { id: "b", text: "In the backpack" },
          { id: "c", text: "On the table" },
          { id: "d", text: "Near the window" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        prompt: "What does the narrator do every day?",
        options: [
          { id: "a", text: "Walk in the park" },
          { id: "b", text: "Work in the park" },
          { id: "c", text: "Cook at home" },
          { id: "d", text: "Buy chairs" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  // ─── Level 2 — daily routine (m1–m8 vocab) ──────────────────────────────
  {
    id: "es-l2-routine",
    level: 2,
    contextHint: "Ana's week",
    topic: "school",
    passage:
      "Me llamo Ana. Soy estudiante.\nEstudio español todos los días.\nSiempre escucho música.\nA veces bailo y canto con mis amigas.\nLos sábados descanso.",
    questions: [
      {
        id: "q1",
        prompt: "What does Ana study?",
        options: [
          { id: "a", text: "English" },
          { id: "b", text: "Music" },
          { id: "c", text: "Spanish" },
          { id: "d", text: "Dance" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q2",
        prompt: "What does she sometimes do with her friends?",
        options: [
          { id: "a", text: "Study and read" },
          { id: "b", text: "Dance and sing" },
          { id: "c", text: "Cook and eat" },
          { id: "d", text: "Work and rest" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q3",
        prompt: "What does she do on Saturdays?",
        options: [
          { id: "a", text: "She rests" },
          { id: "b", text: "She works" },
          { id: "c", text: "She sings" },
          { id: "d", text: "She studies Spanish" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  // ─── Level 3 — at the restaurant (m1–m12 vocab) ─────────────────────────
  {
    id: "es-l3-restaurant",
    level: 3,
    contextHint: "Lunch with a friend",
    topic: "food",
    passage:
      "Mi amigo y yo estamos en un restaurante.\nMe gusta mucho el pollo con arroz.\nMi amigo come sopa y ensalada.\nÉl bebe jugo y yo bebo café.\nLa comida es muy rica.\n—¡La cuenta, por favor!",
    questions: [
      {
        id: "q1",
        prompt: "What does the narrator like a lot?",
        options: [
          { id: "a", text: "Soup and salad" },
          { id: "b", text: "Chicken with rice" },
          { id: "c", text: "Fish with rice" },
          { id: "d", text: "Bread and cheese" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "What does the friend eat?",
        options: [
          { id: "a", text: "Chicken with rice" },
          { id: "b", text: "Eggs and bread" },
          { id: "c", text: "Soup and salad" },
          { id: "d", text: "Meat and potatoes" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        prompt: "How is the food?",
        options: [
          { id: "a", text: "Very tasty" },
          { id: "b", text: "Very expensive" },
          { id: "c", text: "Bad" },
          { id: "d", text: "Cold" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  // ─── Level 3 — weekend plans (m1–m12 vocab) ─────────────────────────────
  {
    id: "es-l3-weekend",
    level: 3,
    contextHint: "Plans for the weekend",
    topic: "travel",
    passage:
      "Este fin de semana vamos a la playa.\nVoy a descansar y leer un libro.\nMi hermana va a comprar los boletos de autobús.\nDespués vamos a comer pescado en un restaurante.",
    questions: [
      {
        id: "q1",
        prompt: "Where are they going this weekend?",
        options: [
          { id: "a", text: "The museum" },
          { id: "b", text: "The beach" },
          { id: "c", text: "The market" },
          { id: "d", text: "The movies" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "What is the narrator going to do?",
        options: [
          { id: "a", text: "Rest and read a book" },
          { id: "b", text: "Swim and dance" },
          { id: "c", text: "Work and study" },
          { id: "d", text: "Buy the tickets" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        prompt: "Who is going to buy the bus tickets?",
        options: [
          { id: "a", text: "The narrator" },
          { id: "b", text: "Their mother" },
          { id: "c", text: "The narrator's sister" },
          { id: "d", text: "A friend" },
        ],
        correctOptionId: "c",
      },
    ],
  },
  // ─── Level 4 — shopping trip (m1–m16 vocab) ─────────────────────────────
  {
    id: "es-l4-shopping",
    level: 4,
    contextHint: "At the market with Mom",
    topic: "daily",
    passage:
      "Estoy en el mercado con mi mamá.\nBusco una chaqueta nueva.\n—¿Cuánto cuesta esta chaqueta azul?\n—Cuesta doscientos pesos.\nEs barata. Pago con tarjeta.\nMi mamá compra un vestido rojo.",
    questions: [
      {
        id: "q1",
        prompt: "What is the narrator looking for?",
        options: [
          { id: "a", text: "A red dress" },
          { id: "b", text: "A new jacket" },
          { id: "c", text: "New shoes" },
          { id: "d", text: "A blue shirt" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "How much does the jacket cost?",
        options: [
          { id: "a", text: "100 pesos" },
          { id: "b", text: "500 pesos" },
          { id: "c", text: "200 pesos" },
          { id: "d", text: "1000 pesos" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        prompt: "How does the narrator pay?",
        options: [
          { id: "a", text: "With a card" },
          { id: "b", text: "With cash" },
          { id: "c", text: "Mom pays" },
          { id: "d", text: "They don't buy it" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  // ─── Level 4 — travel day (m1–m16 vocab) ────────────────────────────────
  {
    id: "es-l4-travel",
    level: 4,
    contextHint: "Arriving at the hotel",
    topic: "travel",
    passage:
      "Hoy vamos a México en avión.\nTengo mi pasaporte y mi maleta.\nEstoy aprendiendo español.\nEn el hotel:\n—Perdón, ¿me puede ayudar? ¿Dónde está la habitación?\n—Está a la derecha, señor.",
    questions: [
      {
        id: "q1",
        prompt: "How are they traveling to Mexico?",
        options: [
          { id: "a", text: "By train" },
          { id: "b", text: "By bus" },
          { id: "c", text: "By plane" },
          { id: "d", text: "By car" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q2",
        prompt: "What does the narrator have?",
        options: [
          { id: "a", text: "A passport and a suitcase" },
          { id: "b", text: "A map and a ticket" },
          { id: "c", text: "A key and a backpack" },
          { id: "d", text: "A reservation and a map" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        prompt: "Where is the room?",
        options: [
          { id: "a", text: "To the left" },
          { id: "b", text: "To the right" },
          { id: "c", text: "Straight ahead" },
          { id: "d", text: "On the corner" },
        ],
        correctOptionId: "b",
      },
    ],
  },
];
