import { diffMetadataArgs, type MetadataSchema } from "exiftool-arg-diff";
import {
  type MergeSchema,
  type Metadata,
  replicateMetadata,
} from "../src/index.js";

const mergeSchema: MergeSchema = {
  Keywords: "union",
  Caption: "overwrite-if-present",
};

const diffSchema: MetadataSchema = {
  Keywords: "additive-list",
  Caption: "overwrite",
};

/**
 * Mirrors the "Composing with exiftool-arg-diff" snippet in the README:
 * replicate source's metadata onto each target, then diff each target's
 * original metadata against the replicated result to get exiftool args.
 */
export function replicateAndDiff(
  source: Metadata,
  targets: Metadata[],
): (string[] | null)[] {
  return targets.map((target) => {
    const merged = replicateMetadata(mergeSchema, source, target);
    return diffMetadataArgs(diffSchema, target, merged);
  });
}
