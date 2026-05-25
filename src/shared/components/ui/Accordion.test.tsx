import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccordionItem } from "./Accordion";

describe("AccordionItem", () => {
  it("hides body content by default", () => {
    render(<AccordionItem title="Faq">Hidden body</AccordionItem>);
    expect(screen.queryByText("Hidden body")).not.toBeInTheDocument();
  });

  it("toggles the body on header click", () => {
    render(<AccordionItem title="Faq">Now visible</AccordionItem>);
    fireEvent.click(screen.getByText("Faq"));
    expect(screen.getByText("Now visible")).toBeInTheDocument();
  });

  it("respects defaultOpen", () => {
    render(
      <AccordionItem title="Faq" defaultOpen>
        Shown
      </AccordionItem>,
    );
    expect(screen.getByText("Shown")).toBeInTheDocument();
  });
});
