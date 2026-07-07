# photo-metadata-replicate

[![npm version](https://img.shields.io/npm/v/photo-metadata-replicate.svg)](https://www.npmjs.com/package/photo-metadata-replicate)

Copy metadata from one item onto a set of targets. Keywords are merged
(union), other fields are copied only if the source has a value. Nothing
gets overwritten with empty data.

## Why

Tagging one photo and applying it to the rest of a shoot is a common
workflow. Doing it naively causes two bugs: overwriting a target's own
keywords, and blanking a caption because the source doesn't have one. This
library avoids both. It's pure logic: no file access, no UI, no dependencies.

## Install

```sh
npm install photo-metadata-replicate
```

## Usage

```ts
import { replicateMetadata, type MergeSchema } from "photo-metadata-replicate";

const schema: MergeSchema = {
  Keywords: "union",
  Caption: "overwrite-if-present",
};

const source = { Keywords: ["beach", "sunset"], Caption: "Golden hour" };
const target = { Keywords: ["family"], Caption: "" };

replicateMetadata(schema, source, target);
// => { Keywords: ["family", "beach", "sunset"], Caption: "Golden hour" }
```

For a whole selection at once:

```ts
import { replicateMetadataToAll } from "photo-metadata-replicate";

replicateMetadataToAll(schema, source, [target1, target2, target3]);
// => one merged result per target, same order as input
```

## API

### `replicateMetadata(schema, source, target)`

Merges `source` into `target` per `schema` and returns the result. Fields
not in `schema` are copied from `target` as-is.

### `replicateMetadataToAll(schema, source, targets)`

Same, applied to each item in `targets` independently.

### `MergeSchema`

`Record<string, MergeStrategy>`, one strategy per field.

### `MergeStrategy`

- `"union"`: for list fields (e.g. `Keywords`, `Subject`). Keeps target's
  items, adds any new ones from source, in order, no duplicates.
- `"overwrite-if-present"`: for scalar fields (e.g. `Caption`, `Title`,
  `Description`). Uses source's value if it has one, otherwise keeps
  target's value. Never blanks a target with an empty source.

### `Metadata`

`Record<string, MetadataValue | MetadataValue[] | undefined>`.

### `MetadataValue`

`string | number`.

## Composing with exiftool-arg-diff

This library only merges metadata. Pair it with
[`exiftool-arg-diff`](https://www.npmjs.com/package/exiftool-arg-diff) to
turn the merged result into exiftool args:

```ts
import { diffMetadataArgs, type MetadataSchema } from "exiftool-arg-diff";
import { replicateMetadata, type MergeSchema } from "photo-metadata-replicate";

const mergeSchema: MergeSchema = {
  Keywords: "union",
  Caption: "overwrite-if-present",
};

const diffSchema: MetadataSchema = {
  Keywords: "additive-list",
  Caption: "overwrite",
};

const argsPerTarget = targets.map((target) => {
  const merged = replicateMetadata(mergeSchema, source, target);
  return diffMetadataArgs(diffSchema, target, merged);
});
// null for a target if nothing changed, otherwise the exiftool args to run
```
