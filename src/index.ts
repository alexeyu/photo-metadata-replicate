/** A scalar metadata value. */
export type MetadataValue = string | number;

/** A field's value: a scalar, a list, or absent. */
type FieldValue = MetadataValue | MetadataValue[] | undefined;

/**
 * Metadata keyed by field name. Scalar fields hold a single value; list
 * fields hold an array. A missing/undefined value means the field is absent.
 */
export type Metadata = Record<string, FieldValue>;

/**
 * How a field is merged from source onto target.
 * - `union`: list field. Result is target's existing items, in their
 *   original order, followed by source's items not already present.
 * - `overwrite-if-present`: scalar field. Result is source's value if
 *   present (defined, not an empty string); otherwise target's original
 *   value is kept.
 */
export type MergeStrategy = "union" | "overwrite-if-present";

/** Per-field strategy declarations, keyed by field name. */
export type MergeSchema = Record<string, MergeStrategy>;

type StrategyMerger = (
  sourceValue: FieldValue,
  targetValue: FieldValue,
) => FieldValue;

/** Merging logic per strategy. Keyed by `MergeStrategy` so adding a new strategy forces adding its merger here. */
const strategyMergers: Record<MergeStrategy, StrategyMerger> = {
  union: mergeUnion,
  "overwrite-if-present": mergeOverwriteIfPresent,
};

/**
 * Replicates `source`'s metadata onto `target` per the given schema and
 * returns the merged result. Fields not declared in `schema` pass through
 * from `target` unchanged.
 */
export function replicateMetadata(
  schema: MergeSchema,
  source: Metadata,
  target: Metadata,
): Metadata {
  const result: Metadata = { ...target };

  for (const [field, strategy] of Object.entries(schema)) {
    result[field] = strategyMergers[strategy](source[field], target[field]);
  }

  return result;
}

/**
 * Replicates `source`'s metadata onto each of `targets` per the given
 * schema. Returns one merged `Metadata` per target, same order as the input.
 */
export function replicateMetadataToAll(
  schema: MergeSchema,
  source: Metadata,
  targets: Metadata[],
): Metadata[] {
  return targets.map((target) => replicateMetadata(schema, source, target));
}

function toList(value: FieldValue): MetadataValue[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/** Target's items, in their original order, followed by source's items not already present. */
function mergeUnion(
  sourceValue: FieldValue,
  targetValue: FieldValue,
): MetadataValue[] {
  const merged = new Set(toList(targetValue));
  for (const item of toList(sourceValue)) {
    merged.add(item);
  }
  return [...merged];
}

function isPresent(value: FieldValue): boolean {
  return value !== undefined && value !== "";
}

/** Source's value if present (defined, not an empty string); otherwise target's original value. */
function mergeOverwriteIfPresent(
  sourceValue: FieldValue,
  targetValue: FieldValue,
): FieldValue {
  return isPresent(sourceValue) ? sourceValue : targetValue;
}
