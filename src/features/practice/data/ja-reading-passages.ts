export type ReadingOption = {
  id: string;
  text: string;
};

export type ReadingQuestion = {
  id: string;
  prompt: string;
  options: ReadingOption[];
  correctOptionId: string;
  explanation?: string;
};

export type ReadingPassage = {
  id: string;
  level: number;
  contextHint?: string;
  passage: string;
  questions: ReadingQuestion[];
  topic: "daily" | "travel" | "school" | "work" | "food";
};

export const READING_PASSAGES: ReadingPassage[] = [
  {
    id: "m7-daily-1",
    level: 7,
    contextHint: "Tanaka's day",
    topic: "daily",
    passage:
      "きょう たなかさんは あさ ろくじに おきました。\nそれから みずを のみました。\nくじに がっこうに いきました。",
    questions: [
      {
        id: "q1",
        prompt: "What time did Tanaka wake up?",
        options: [
          { id: "a", text: "6 o'clock" },
          { id: "b", text: "7 o'clock" },
          { id: "c", text: "9 o'clock" },
          { id: "d", text: "8 o'clock" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q2",
        prompt: "What did Tanaka drink?",
        options: [
          { id: "a", text: "Tea" },
          { id: "b", text: "Water" },
          { id: "c", text: "Coffee" },
          { id: "d", text: "Juice" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q3",
        prompt: "Where did Tanaka go?",
        options: [
          { id: "a", text: "Work" },
          { id: "b", text: "The store" },
          { id: "c", text: "School" },
          { id: "d", text: "Home" },
        ],
        correctOptionId: "c",
      },
    ],
  },
  {
    id: "m7-food-1",
    level: 7,
    contextHint: "At the restaurant",
    topic: "food",
    passage:
      "やまださんと ともだちは レストランに いきました。\nやまださんは さかなを たべました。\nともだちは にくを たべました。\nとても おいしかったです。",
    questions: [
      {
        id: "q1",
        prompt: "Who did Yamada go with?",
        options: [
          { id: "a", text: "Family" },
          { id: "b", text: "A friend" },
          { id: "c", text: "Alone" },
          { id: "d", text: "Coworker" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "What did Yamada eat?",
        options: [
          { id: "a", text: "Meat" },
          { id: "b", text: "Vegetables" },
          { id: "c", text: "Fish" },
          { id: "d", text: "Rice" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        prompt: "How was the food?",
        options: [
          { id: "a", text: "Expensive" },
          { id: "b", text: "Delicious" },
          { id: "c", text: "Bad" },
          { id: "d", text: "Cheap" },
        ],
        correctOptionId: "b",
      },
    ],
  },
  {
    id: "m7-daily-2",
    level: 7,
    contextHint: "Weekend plan",
    topic: "daily",
    passage:
      "どようびに ともだちと えいがを みます。\nそのあと カフェで コーヒーを のみます。\nにちようびは いえで ほんを よみます。",
    questions: [
      {
        id: "q1",
        prompt: "What will they do on Saturday?",
        options: [
          { id: "a", text: "Read a book" },
          { id: "b", text: "Watch a movie" },
          { id: "c", text: "Go shopping" },
          { id: "d", text: "Play sports" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "What will they drink at the cafe?",
        options: [
          { id: "a", text: "Tea" },
          { id: "b", text: "Water" },
          { id: "c", text: "Coffee" },
          { id: "d", text: "Juice" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        prompt: "What will they do on Sunday?",
        options: [
          { id: "a", text: "Go out with friends" },
          { id: "b", text: "Watch TV" },
          { id: "c", text: "Read at home" },
          { id: "d", text: "Go to the cafe" },
        ],
        correctOptionId: "c",
      },
    ],
  },
  {
    id: "m7-travel-1",
    level: 7,
    contextHint: "At the station",
    topic: "travel",
    passage:
      "すずきさんは えきに いきました。\nでんしゃで とうきょうに いきます。\nとうきょうで ともだちに あいます。",
    questions: [
      {
        id: "q1",
        prompt: "Where did Suzuki go?",
        options: [
          { id: "a", text: "The airport" },
          { id: "b", text: "The station" },
          { id: "c", text: "The bus stop" },
          { id: "d", text: "Tokyo" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "How is Suzuki going to Tokyo?",
        options: [
          { id: "a", text: "By bus" },
          { id: "b", text: "By car" },
          { id: "c", text: "By train" },
          { id: "d", text: "By plane" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        prompt: "What will Suzuki do in Tokyo?",
        options: [
          { id: "a", text: "Go shopping" },
          { id: "b", text: "Meet a friend" },
          { id: "c", text: "See a movie" },
          { id: "d", text: "Eat sushi" },
        ],
        correctOptionId: "b",
      },
    ],
  },
  {
    id: "m7-school-1",
    level: 7,
    contextHint: "School life",
    topic: "school",
    passage:
      "まいにち がっこうで にほんごを べんきょうします。\nせんせいは とても やさしいです。\nクラスの あとで ともだちと はなします。",
    questions: [
      {
        id: "q1",
        prompt: "What do they study?",
        options: [
          { id: "a", text: "English" },
          { id: "b", text: "Math" },
          { id: "c", text: "Japanese" },
          { id: "d", text: "History" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q2",
        prompt: "What is the teacher like?",
        options: [
          { id: "a", text: "Strict" },
          { id: "b", text: "Kind" },
          { id: "c", text: "Funny" },
          { id: "d", text: "Quiet" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q3",
        prompt: "What do they do after class?",
        options: [
          { id: "a", text: "Study more" },
          { id: "b", text: "Go home" },
          { id: "c", text: "Talk with friends" },
          { id: "d", text: "Play sports" },
        ],
        correctOptionId: "c",
      },
    ],
  },
];
