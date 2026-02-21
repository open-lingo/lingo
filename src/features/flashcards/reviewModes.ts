/** How the card is displayed during review. */
export type ReviewMode = "word-first" | "image-first";

/** Default: front = word only, back = image + translation. */
export const REVIEW_MODE_WORD_FIRST: ReviewMode = "word-first";

/** Front = image + word, back = translation + image (image on both sides). */
export const REVIEW_MODE_IMAGE_FIRST: ReviewMode = "image-first";

export const REVIEW_MODES: ReviewMode[] = ["word-first", "image-first"];

export const REVIEW_MODE_LABELS: Record<ReviewMode, string> = {
  "word-first": "flashcards.reviewModeWordFirst",
  "image-first": "flashcards.reviewModeImageFirst",
};
