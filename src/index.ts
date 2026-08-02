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
 * How a field is merged from source onto target. An empty value (absent, an
 * empty string, or a list holding only those) carries no information, so it
 * never overwrites and never enters a list.
 * - `union`: list field. Result is target's existing items, in their
 *   original order, followed by source's items not already present.
 *   Declaring this on a scalar field turns it into a list, so use it only
 *   for fields that hold arrays.
 * - `overwrite-if-present`: scalar field. Result is source's value when it
 *   carries information, otherwise target's original value is kept.
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

/**
 * An item carries information if it is defined and not an empty string. The
 * `null` check guards JS callers and JSON round-trips, which produce values
 * the `MetadataValue` type does not allow.
 */
function isPresentItem(
  item: MetadataValue | null | undefined,
): item is MetadataValue {
  return item !== undefined && item !== null && item !== "";
}

/** A field's values as a list, dropping entries that carry no information. */
function toPresentList(value: FieldValue): MetadataValue[] {
  const items = Array.isArray(value) ? value : [value];
  return items.filter(isPresentItem);
}

/** A field carries information if it holds at least one present item. */
function isPresent(value: FieldValue): boolean {
  return toPresentList(value).length > 0;
}

/** Target's items, in their original order, followed by source's items not already present. */
function mergeUnion(
  sourceValue: FieldValue,
  targetValue: FieldValue,
): MetadataValue[] {
  const merged = new Set(toPresentList(targetValue));
  for (const item of toPresentList(sourceValue)) {
    merged.add(item);
  }
  return [...merged];
}

/** Source's value if it carries information, otherwise target's original value. */
function mergeOverwriteIfPresent(
  sourceValue: FieldValue,
  targetValue: FieldValue,
): FieldValue {
  return isPresent(sourceValue) ? sourceValue : targetValue;
}
