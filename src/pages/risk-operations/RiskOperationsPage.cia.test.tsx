import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Risk } from "../../shared/types/risk-operations";
import { affectedCiaField, buildPayload, formFromRow, initialForm } from "./RiskOperationsPage";

const storedRisk = (affectedCia: string[]): Risk =>
  ({
    id: "r1",
    assetId: "a1",
    title: "t",
    scenario: "s",
    threat: "th",
    vulnerability: "v",
    affectedCia,
    likelihood: 3,
    impact: 4,
    status: "OPEN",
    ownerName: "owner",
  }) as unknown as Risk;

function CiaHarness({ initial }: { initial: Record<string, string> }) {
  const [form, setForm] = useState(initial);
  return (
    <>
      {affectedCiaField(form, (field, value) => setForm((prev) => ({ ...prev, [field]: value })))}
      <output data-testid="payload">{JSON.stringify(buildPayload("risks", form).affectedCia)}</output>
    </>
  );
}

const pick = (label: string) => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(within(screen.getByRole("listbox")).getByText(label));
};

afterEach(cleanup);

describe("risk form CIA wiring", () => {
  it("sends C, I and A for a new risk", () => {
    expect(buildPayload("risks", initialForm).affectedCia).toEqual(["C", "I", "A"]);
  });

  it("keeps the stored CIA when a risk is edited without touching it", () => {
    const form = formFromRow("risks", storedRisk(["C"]));
    expect(buildPayload("risks", form).affectedCia).toEqual(["C"]);
  });

  it("sends the CIA the user selects in the form", () => {
    render(<CiaHarness initial={formFromRow("risks", storedRisk(["C"]))} />);

    pick("Integridad");

    expect(screen.getByTestId("payload").textContent).toBe('["C","I"]');
  });

  it("does not let the user clear the last CIA value", () => {
    render(<CiaHarness initial={formFromRow("risks", storedRisk(["C"]))} />);

    pick("Confidencialidad");

    expect(screen.getByTestId("payload").textContent).toBe('["C"]');
  });
});
