import { Link } from "react-router-dom";
import { FlashcardTester } from "./FlashcardTester";

export function FlashcardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
        <Link
          to="/"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Back
        </Link>
      </div>
      <FlashcardTester />
    </div>
  );
}
