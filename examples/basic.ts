import { type MergeSchema, replicateMetadata } from "../src/index.js";

const schema: MergeSchema = {
  Keywords: "union",
  Caption: "overwrite-if-present",
};

const source = { Keywords: ["beach", "sunset"], Caption: "Golden hour" };
const target = { Keywords: ["family"], Caption: "" };

/** Mirrors the "Usage" snippet in the README. */
export function run() {
  return replicateMetadata(schema, source, target);
}
