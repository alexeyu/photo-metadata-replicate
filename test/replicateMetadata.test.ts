import { describe, expect, it } from "vitest";
import { type MergeSchema, replicateMetadata } from "../src/index.js";

describe("replicateMetadata (union strategy)", () => {
  const schema: MergeSchema = { Keywords: "union" };

  it("copies source's items when target has none", () => {
    const source = { Keywords: ["landscape", "summer"] };
    const target = { Keywords: [] };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["landscape", "summer"],
    });
  });

  it("de-duplicates overlapping items, target's original order first", () => {
    const source = { Keywords: ["summer", "evening"] };
    const target = { Keywords: ["landscape", "summer"] };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["landscape", "summer", "evening"],
    });
  });

  it("leaves target's list unchanged when source's list is empty", () => {
    const source = { Keywords: [] };
    const target = { Keywords: ["a", "b"] };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["a", "b"],
    });
  });

  it("leaves target's list unchanged when source's list is absent", () => {
    const source = {};
    const target = { Keywords: ["a", "b"] };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["a", "b"],
    });
  });

  it("treats an absent target list as empty", () => {
    const source = { Keywords: ["a"] };
    const target = {};

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["a"],
    });
  });

  it("passes through fields not declared in the schema unchanged", () => {
    const source = { Keywords: ["b"], Caption: "world" };
    const target = { Keywords: ["a"], Caption: "hello" };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["a", "b"],
      Caption: "hello",
    });
  });

  it("does not mutate the caller's source or target objects", () => {
    const source = { Keywords: ["b"] };
    const target = { Keywords: ["a"] };

    replicateMetadata(schema, source, target);

    expect(source.Keywords).toEqual(["b"]);
    expect(target.Keywords).toEqual(["a"]);
  });
});
