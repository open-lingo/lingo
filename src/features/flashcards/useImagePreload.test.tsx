import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useImagePreload } from "./useImagePreload";
import type { Flashcard } from "@/features/flashcards/data/types";

function card(id: string, image?: string): Flashcard {
  return { id, front: id, back: id, image } as Flashcard;
}

describe("useImagePreload", () => {
  let created: string[];
  let OrigImage: typeof Image;

  beforeEach(() => {
    created = [];
    OrigImage = globalThis.Image;
    // Stub Image so we can observe which src values get requested.
    class FakeImage {
      decoding = "";
      private _src = "";
      set src(v: string) {
        this._src = v;
        created.push(v);
      }
      get src() {
        return this._src;
      }
    }
    // @ts-expect-error test stub
    globalThis.Image = FakeImage;
  });

  afterEach(() => {
    globalThis.Image = OrigImage;
  });

  it("preloads the next N cards' images (skipping current)", () => {
    const cards = [
      card("a", "/a.png"),
      card("b", "/b.png"),
      card("c", "/c.png"),
      card("d", "/d.png"),
      card("e", "/e.png"),
    ];
    renderHook(() => useImagePreload(cards, 0, 3));
    // index 0 = current ('a'); preload b, c, d.
    expect(created).toEqual(["/b.png", "/c.png", "/d.png"]);
  });

  it("skips cards without images and never re-requests the same src", () => {
    const cards = [card("a", "/a.png"), card("b"), card("c", "/c.png")];
    const { rerender } = renderHook(
      ({ idx }) => useImagePreload(cards, idx, 3),
      { initialProps: { idx: 0 } },
    );
    expect(created).toEqual(["/c.png"]); // b has no image
    rerender({ idx: 0 });
    expect(created).toEqual(["/c.png"]); // not requested again
  });
});
