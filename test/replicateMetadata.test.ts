import { describe, expect, it } from "vitest";
import {
  type MergeSchema,
  type Metadata,
  replicateMetadata,
  replicateMetadataToAll,
} from "../src/index.js";

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

  it("does not add an empty string from source as an item", () => {
    const source = { Keywords: "" };
    const target = { Keywords: ["a"] };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["a"],
    });
  });

  it("drops empty items already held by target", () => {
    const source = { Keywords: ["b"] };
    const target = { Keywords: ["a", ""] };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["a", "b"],
    });
  });

  it("turns a scalar field into a list, so declare it only on arrays", () => {
    const source = { Keywords: "from source" };
    const target = { Keywords: "from target" };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Keywords: ["from target", "from source"],
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

describe("replicateMetadata (overwrite-if-present strategy)", () => {
  const schema: MergeSchema = {
    Caption: "overwrite-if-present",
    Description: "overwrite-if-present",
  };

  it("copies source's value onto target when present", () => {
    const source = { Caption: "caption", Description: "description" };
    const target = {};

    expect(replicateMetadata(schema, source, target)).toEqual({
      Caption: "caption",
      Description: "description",
    });
  });

  it("replaces target's existing value with source's, when source is present", () => {
    const source = { Caption: "new caption" };
    const target = { Caption: "old caption" };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Caption: "new caption",
    });
  });

  it("does not blank out target when source's value is an empty string", () => {
    const source = { Caption: "" };
    const target = { Caption: "existing caption" };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Caption: "existing caption",
    });
  });

  it("does not blank out target when source's value is an empty list", () => {
    const source = { Keywords: [] };
    const target = { Keywords: ["keep", "me"] };

    expect(
      replicateMetadata({ Keywords: "overwrite-if-present" }, source, target),
    ).toEqual({ Keywords: ["keep", "me"] });
  });

  it("does not blank out target when source's list holds only empties", () => {
    const source = { Keywords: ["", ""] };
    const target = { Keywords: ["keep"] };

    expect(
      replicateMetadata({ Keywords: "overwrite-if-present" }, source, target),
    ).toEqual({ Keywords: ["keep"] });
  });

  it("does not blank out target when source's value is null", () => {
    // `null` is outside MetadataValue, but JS callers and JSON round-trips
    // produce it, and it must not be mistaken for a real value.
    const source = { Caption: null } as unknown as Metadata;
    const target = { Caption: "keep me" };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Caption: "keep me",
    });
  });

  it("does not blank out target when source's value is absent", () => {
    const source = {};
    const target = { Caption: "existing caption" };

    expect(replicateMetadata(schema, source, target)).toEqual({
      Caption: "existing caption",
    });
  });

  it("leaves target absent when both source and target are absent", () => {
    const source = {};
    const target = {};

    expect(replicateMetadata(schema, source, target)).toEqual({
      Caption: undefined,
      Description: undefined,
    });
  });

  it("handles numeric scalar values", () => {
    const ratingSchema: MergeSchema = { Rating: "overwrite-if-present" };
    const source = { Rating: 5 };
    const target = { Rating: 3 };

    expect(replicateMetadata(ratingSchema, source, target)).toEqual({
      Rating: 5,
    });
  });
});

describe("replicateMetadataToAll", () => {
  const schema: MergeSchema = {
    Keywords: "union",
    Caption: "overwrite-if-present",
  };

  it("applies the same schema and source to every target independently", () => {
    const source = { Keywords: ["summer"], Caption: "shoot caption" };
    const targets = [
      { Keywords: ["beach"], Caption: "" },
      { Keywords: ["family"], Caption: "already captioned" },
    ];

    expect(replicateMetadataToAll(schema, source, targets)).toEqual([
      { Keywords: ["beach", "summer"], Caption: "shoot caption" },
      { Keywords: ["family", "summer"], Caption: "shoot caption" },
    ]);
  });

  it("returns one merged result per target, same order as input", () => {
    const source = { Caption: "x" };
    const targets = [{ id: "a" }, { id: "b" }, { id: "c" }];

    const result = replicateMetadataToAll(schema, source, targets);

    expect(result.map((metadata) => metadata.id)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for an empty target list", () => {
    expect(replicateMetadataToAll(schema, { Caption: "x" }, [])).toEqual([]);
  });
});
