# photo-metadata-replicate

[![CI](https://github.com/alexeyu/photo-metadata-replicate/actions/workflows/ci.yml/badge.svg)](https://github.com/alexeyu/photo-metadata-replicate/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/photo-metadata-replicate.svg)](https://www.npmjs.com/package/photo-metadata-replicate)
[![license: MIT](https://img.shields.io/npm/l/photo-metadata-replicate.svg)](./LICENSE)

Your user tags one photo and wants it applied to the other forty. This
library computes what each target's metadata should become and returns it
as plain objects, so you can show the result in a UI, diff it, or hand it
to a writer.

The target keeps its keywords, and an empty source field erases nothing.
It's pure logic: no file access, no UI, no dependencies.

If your inputs are files on disk and you only need the write to happen,
`exiftool` does that same merge directly and will serve you better:

```sh
exiftool -tagsFromFile source.jpg "-Subject+<Subject" targets/
```

Reach for this library when the metadata lives in objects (a selection in
a tagging UI, rows from a database, a model the user is editing) and you
need the merged result before anything touches a file.

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
  items in their original order, appends source's new ones, no duplicates.
  Declaring it on a scalar field turns that field into a list, so use it
  only where you expect arrays.
- `"overwrite-if-present"`: for scalar fields (e.g. `Caption`, `Title`,
  `Description`). Uses source's value when that value carries information,
  otherwise keeps target's.

An empty value never overwrites a target and never enters a list. Empty
means an absent field, an empty string, an empty array, or an array holding
only those.

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
