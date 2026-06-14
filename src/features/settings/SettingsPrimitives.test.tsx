import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader, SettingsGroup, SettingRow } from "./SettingsPrimitives";

describe("SettingsPrimitives", () => {
  describe("SectionHeader", () => {
    it("renders the title as a heading with an optional description", () => {
      render(
        <SectionHeader title="Appearance" description="Colors and contrast." />,
      );
      expect(
        screen.getByRole("heading", { name: "Appearance" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Colors and contrast.")).toBeInTheDocument();
    });

    it("omits the description paragraph when not provided", () => {
      const { container } = render(<SectionHeader title="Audio" />);
      expect(container.querySelectorAll("p")).toHaveLength(0);
    });
  });

  describe("SettingsGroup", () => {
    it("renders an optional uppercase sub-label", () => {
      render(
        <SettingsGroup label="Alphabet display">
          <div>child</div>
        </SettingsGroup>,
      );
      expect(screen.getByText("Alphabet display")).toBeInTheDocument();
      expect(screen.getByText("child")).toBeInTheDocument();
    });
  });

  describe("SettingRow", () => {
    it("renders the label, helper text, and control", () => {
      render(
        <SettingRow
          label="Reduce motion"
          help="Minimize animations."
          control={<button type="button">toggle</button>}
        />,
      );
      expect(screen.getByText("Reduce motion")).toBeInTheDocument();
      expect(screen.getByText("Minimize animations.")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "toggle" }),
      ).toBeInTheDocument();
    });

    it("renders as a <label> when asLabel is set", () => {
      const { container } = render(
        <SettingRow asLabel label="Silent mode" control={<span />} />,
      );
      expect(container.querySelector("label")).not.toBeNull();
    });

    it("renders as a <div>, not a <label>, by default", () => {
      const { container } = render(
        <SettingRow label="App volume" control={<span />} />,
      );
      expect(container.querySelector("label")).toBeNull();
    });
  });
});
