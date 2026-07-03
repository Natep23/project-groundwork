import { describe, it, expect } from "vitest";
import { linkTitle } from "../../components/ResearchList";

describe("linkTitle", () => {
  it("extracts the note name from an obsidian link", () => {
    expect(linkTitle("obsidian://open?vault=Dev&file=My%20Note.md")).toBe("My Note");
  });

  it("uses the last path segment for nested obsidian notes", () => {
    expect(linkTitle("obsidian://open?vault=Dev&file=Projects%2FGroundWork%20Ideas.md")).toBe(
      "GroundWork Ideas"
    );
  });

  it("falls back to a label for obsidian links without a file", () => {
    expect(linkTitle("obsidian://open?vault=Dev")).toBe("Obsidian note");
  });

  it("shows host and path for web links", () => {
    expect(linkTitle("https://react.dev/learn")).toBe("react.dev/learn");
    expect(linkTitle("https://example.com/")).toBe("example.com");
  });

  it("returns the raw string when unparseable", () => {
    expect(linkTitle("not a url")).toBe("not a url");
  });
});
