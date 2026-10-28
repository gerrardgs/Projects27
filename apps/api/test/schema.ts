// A small JSON Schema checker for the subset used in packages/contract/openapi.json:
// type (including ["x", "null"]), const, enum, pattern, minLength, maxLength, properties,
// required, additionalProperties: false, items, oneOf and local $ref. Formats are not checked.

type Schema = Record<string, unknown>;

function resolve(root: Schema, ref: string): Schema {
  return ref
    .replace("#/", "")
    .split("/")
    .reduce<unknown>((node, key) => (node as Schema)[key], root) as Schema;
}

function kindOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return Number.isInteger(value) ? "integer" : typeof value;
}

function checkType(schema: Schema, value: unknown, path: string): string | null {
  if (schema.type === undefined) return null;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const kind = kindOf(value);
  const ok = types.includes(kind) || (kind === "integer" && types.includes("number"));
  return ok ? null : `${path}: expected ${types.join(" or ")}, got ${kind}`;
}

function checkValue(schema: Schema, value: unknown, path: string): string[] {
  const errors: string[] = [];
  if ("const" in schema && value !== schema.const) errors.push(`${path}: expected ${JSON.stringify(schema.const)}`);
  if (Array.isArray(schema.enum) && !schema.enum.includes(value))
    errors.push(`${path}: ${JSON.stringify(value)} not in enum`);
  return errors;
}

function checkString(schema: Schema, value: string, path: string): string[] {
  const errors: string[] = [];
  if (typeof schema.pattern === "string" && !new RegExp(schema.pattern, "u").test(value)) {
    errors.push(`${path}: "${value}" does not match ${schema.pattern}`);
  }
  if (typeof schema.minLength === "number" && value.length < schema.minLength)
    errors.push(`${path}: shorter than ${schema.minLength}`);
  if (typeof schema.maxLength === "number" && value.length > schema.maxLength)
    errors.push(`${path}: longer than ${schema.maxLength}`);
  return errors;
}

function checkObject(root: Schema, schema: Schema, object: Record<string, unknown>, path: string): string[] {
  const errors: string[] = [];
  for (const key of (schema.required as string[] | undefined) ?? []) {
    if (!(key in object)) errors.push(`${path}.${key}: required`);
  }
  const properties = (schema.properties as Record<string, Schema> | undefined) ?? {};
  for (const [key, child] of Object.entries(properties)) {
    if (key in object) errors.push(...validate(root, child, object[key], `${path}.${key}`));
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(object)) {
      if (!(key in properties)) errors.push(`${path}.${key}: not allowed`);
    }
  }
  return errors;
}

function checkOneOf(root: Schema, options: unknown[], value: unknown, path: string): string[] {
  const matches = options.filter((option) => validate(root, option as Schema, value, path).length === 0).length;
  return matches === 1 ? [] : [`${path}: matches ${matches} of the oneOf schemas`];
}

function checkItems(root: Schema, schema: Schema, value: unknown[], path: string): string[] {
  if (schema.items === undefined) return [];
  return value.flatMap((item, index) => validate(root, schema.items as Schema, item, `${path}[${index}]`));
}

export function validate(root: Schema, schema: Schema, value: unknown, path = "$"): string[] {
  if (typeof schema.$ref === "string") return validate(root, resolve(root, schema.$ref), value, path);
  if (Array.isArray(schema.oneOf)) return checkOneOf(root, schema.oneOf, value, path);
  const typeError = checkType(schema, value, path);
  const errors = checkValue(schema, value, path);
  if (typeError !== null) return [...errors, typeError];
  if (typeof value === "string") errors.push(...checkString(schema, value, path));
  if (Array.isArray(value)) errors.push(...checkItems(root, schema, value, path));
  if (kindOf(value) === "object") errors.push(...checkObject(root, schema, value as Record<string, unknown>, path));
  return errors;
}
