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
 * Only "union" is implemented so far; "overwrite-if-present" is added in M2.
 */
export type MergeStrategy = "union";

/** Per-field strategy declarations, keyed by field name. */
export type MergeSchema = Record<string, MergeStrategy>;

type StrategyMerger = (
  sourceValue: FieldValue,
  targetValue: FieldValue,
) => FieldValue;

/** Merging logic per strategy. Keyed by `MergeStrategy` so adding a new strategy forces adding its merger here. */
const strategyMergers: Record<MergeStrategy, StrategyMerger> = {
  union: mergeUnion,
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
