import type { ReadingPassage } from "@/features/practice/data/ja-reading-passages";

export const KO_READING_PASSAGES: ReadingPassage[] = [
  {
    id: "ko-m3-daily-1",
    level: 3,
    contextHint: "Minho's morning",
    topic: "daily",
    passage:
      "민호는 아침 7시에 일어났어요.\n물을 마셨어요.\n학교에 갔어요.",
    questions: [
      {
        id: "q1",
        prompt: "What time did Minho wake up?",
        options: [
          { id: "a", text: "7 o'clock" },
          { id: "b", text: "8 o'clock" },
          { id: "c", text: "6 o'clock" },
          { id: "d", text: "9 o'clock" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q2",
        prompt: "What did Minho drink?",
        options: [
          { id: "a", text: "Coffee" },
          { id: "b", text: "Water" },
          { id: "c", text: "Juice" },
          { id: "d", text: "Tea" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q3",
        prompt: "Where did Minho go?",
        options: [
          { id: "a", text: "Work" },
          { id: "b", text: "Home" },
          { id: "c", text: "School" },
          { id: "d", text: "The store" },
        ],
        correctOptionId: "c",
      },
    ],
  },
  {
    id: "ko-m3-food-1",
    level: 3,
    contextHint: "At the restaurant",
    topic: "food",
    passage:
      "수지하고 친구는 식당에 갔어요.\n수지는 비빔밥을 먹었어요.\n친구는 불고기를 먹었어요.\n아주 맛있었어요.",
    questions: [
      {
        id: "q1",
        prompt: "Who did Suji go with?",
        options: [
          { id: "a", text: "Family" },
          { id: "b", text: "A friend" },
          { id: "c", text: "Alone" },
          { id: "d", text: "Teacher" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        prompt: "What did Suji eat?",
        options: [
          { id: "a", text: "Bulgogi" },
          { id: "b", text: "Kimchi" },
          { id: "c", text: "Bibimbap" },
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
          { id: "c", text: "Spicy" },
          { id: "d", text: "Bad" },
        ],
        correctOptionId: "b",
      },
    ],
  },
];
