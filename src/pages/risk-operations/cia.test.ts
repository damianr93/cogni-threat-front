import { describe, expect, it } from "vitest";
import { DEFAULT_CIA, formatCia, nextCiaSelection, parseCia } from "./cia";

describe("parseCia", () => {
  it("keeps a single selection untouched", () => {
    expect(parseCia(["C"])).toEqual(["C"]);
    expect(parseCia("C")).toEqual(["C"]);
  });

  it("returns ordered unique C/I/A values", () => {
    expect(parseCia(["A", "C", "A", "I"])).toEqual(["C", "I", "A"]);
    expect(parseCia("A,C,A")).toEqual(["C", "A"]);
  });

  it("drops unknown values", () => {
    expect(parseCia(["X", "I", "c", ""])).toEqual(["I"]);
  });

  it("returns an empty list for missing or empty input", () => {
    expect(parseCia(undefined)).toEqual([]);
    expect(parseCia(null)).toEqual([]);
    expect(parseCia("")).toEqual([]);
  });

  it("defaults to C,I,A for new risks", () => {
    expect(DEFAULT_CIA).toBe("C,I,A");
    expect(parseCia(DEFAULT_CIA)).toEqual(["C", "I", "A"]);
  });
});

describe("formatCia", () => {
  it("serializes normalized values for the string form state", () => {
    expect(formatCia(["A", "C"])).toBe("C,A");
    expect(formatCia(undefined)).toBe("");
  });
});

describe("nextCiaSelection", () => {
  it("applies a non-empty selection", () => {
    expect(nextCiaSelection("C,I,A", ["I"])).toBe("I");
  });

  it("keeps the previous selection when the last value is removed", () => {
    expect(nextCiaSelection("C", [])).toBe("C");
  });
});
