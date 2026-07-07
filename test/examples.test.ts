import { describe, expect, it } from "vitest";
import { run as runBasicExample } from "../examples/basic.js";
import { replicateAndDiff } from "../examples/exiftool-arg-diff-integration.js";

describe("README examples", () => {
  it("basic usage example computes the documented merge", () => {
    expect(runBasicExample()).toEqual({
      Keywords: ["family", "beach", "sunset"],
      Caption: "Golden hour",
    });
  });

  it("exiftool-arg-diff composition example diffs the replicated result per target", () => {
    const source = { Keywords: ["summer"], Caption: "Golden hour" };
    const targets = [
      { Keywords: ["beach"], Caption: "" },
      { Keywords: ["summer", "beach"], Caption: "Already captioned" },
    ];

    expect(replicateAndDiff(source, targets)).toEqual([
      ["-Keywords+=summer", "-Caption=Golden hour"],
      ["-Caption=Golden hour"],
    ]);
  });
});
