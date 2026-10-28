// A realistic GET /v1/files/:file_key/variables/local response, type-checked against Figma's official
// typings (@figma/rest-api-spec), so `npm run typecheck` fails if the fixture drifts from the real API shape.
import type { GetLocalVariablesResponse, LocalVariable } from "@figma/rest-api-spec";

type VariableSpec = Pick<LocalVariable, "id" | "name" | "variableCollectionId" | "resolvedType" | "valuesByMode"> &
  Partial<LocalVariable>;

/** Fills the fields every real variable has, so each entry below shows only what matters for the test. */
const variable = (spec: VariableSpec): LocalVariable => ({
  key: `key-${spec.id}`,
  remote: false,
  description: "",
  hiddenFromPublishing: false,
  scopes: ["ALL_SCOPES"],
  codeSyntax: {},
  ...spec,
});

const P = "VariableCollectionId:1:1"; // Primitives, one mode
const T = "VariableCollectionId:1:2"; // Theme, Light and Dark
const R = "VariableCollectionId:9:9"; // remote library collection
const alias = (id: string) => ({ type: "VARIABLE_ALIAS" as const, id });

const variables: LocalVariable[] = [
  variable({
    id: "VariableID:1:10",
    name: "color/neutral/0",
    variableCollectionId: P,
    resolvedType: "COLOR",
    valuesByMode: { "1:0": { r: 1, g: 1, b: 1, a: 1 } },
  }),
  variable({
    id: "VariableID:1:11",
    name: "color/neutral/900",
    variableCollectionId: P,
    resolvedType: "COLOR",
    valuesByMode: { "1:0": { r: 0.0667, g: 0.0941, b: 0.1529, a: 1 } },
  }),
  variable({
    id: "VariableID:1:12",
    name: "color/blue/600",
    variableCollectionId: P,
    resolvedType: "COLOR",
    valuesByMode: { "1:0": { r: 0.1412, g: 0.3412, b: 0.8392, a: 1 } },
    scopes: ["ALL_FILLS", "STROKE_COLOR"],
    description: "Primary brand blue",
    codeSyntax: { WEB: "var(--color-blue-600)" },
  }),
  variable({
    id: "VariableID:1:13",
    name: "color/overlay",
    variableCollectionId: P,
    resolvedType: "COLOR",
    valuesByMode: { "1:0": { r: 0, g: 0, b: 0, a: 0.5 } },
  }),
  variable({
    id: "VariableID:1:20",
    name: "space/4",
    variableCollectionId: P,
    resolvedType: "FLOAT",
    valuesByMode: { "1:0": 16 },
    scopes: ["GAP", "WIDTH_HEIGHT"],
  }),
  variable({
    id: "VariableID:1:21",
    name: "radius/Medium",
    variableCollectionId: P,
    resolvedType: "FLOAT",
    valuesByMode: { "1:0": 8 },
    scopes: ["CORNER_RADIUS"],
  }),
  variable({
    id: "VariableID:1:22",
    name: "font/weight/bold",
    variableCollectionId: P,
    resolvedType: "FLOAT",
    valuesByMode: { "1:0": 700 },
    scopes: ["FONT_WEIGHT"],
  }),
  variable({
    id: "VariableID:1:23",
    name: "opacity/disabled",
    variableCollectionId: P,
    resolvedType: "FLOAT",
    valuesByMode: { "1:0": 0.4 },
    scopes: ["OPACITY"],
  }),
  variable({
    id: "VariableID:1:24",
    name: "font/family/sans",
    variableCollectionId: P,
    resolvedType: "STRING",
    valuesByMode: { "1:0": "Inter" },
    scopes: ["FONT_FAMILY"],
  }),
  variable({
    id: "VariableID:1:25",
    name: "copy/brand name",
    variableCollectionId: P,
    resolvedType: "STRING",
    valuesByMode: { "1:0": "Example" },
    scopes: ["TEXT_CONTENT"],
  }),
  variable({
    id: "VariableID:1:26",
    name: "flags/beta",
    variableCollectionId: P,
    resolvedType: "BOOLEAN",
    valuesByMode: { "1:0": true },
    scopes: [],
  }),
  variable({
    id: "VariableID:1:30",
    name: "surface/default",
    variableCollectionId: T,
    resolvedType: "COLOR",
    valuesByMode: { "2:0": alias("VariableID:1:10"), "2:1": alias("VariableID:1:11") },
  }),
  variable({
    id: "VariableID:1:31",
    name: "text/default",
    variableCollectionId: T,
    resolvedType: "COLOR",
    valuesByMode: { "2:0": alias("VariableID:1:11"), "2:1": alias("VariableID:1:10") },
  }),
  variable({
    id: "VariableID:1:32",
    name: "action/default",
    variableCollectionId: T,
    resolvedType: "COLOR",
    valuesByMode: { "2:0": alias("VariableID:1:12"), "2:1": alias("VariableID:1:12") },
  }),
  variable({
    id: "VariableID:1:33",
    name: "action/tint",
    variableCollectionId: T,
    resolvedType: "COLOR",
    valuesByMode: {
      "2:0": { color: alias("VariableID:1:12"), opacity: 20 },
      "2:1": { color: alias("VariableID:1:12"), opacity: 30 },
    },
  }),
  variable({
    id: "VariableID:1:34",
    name: "brand/accent",
    variableCollectionId: T,
    resolvedType: "COLOR",
    valuesByMode: { "2:0": alias("VariableID:77:1"), "2:1": alias("VariableID:77:1") },
  }),
  variable({
    id: "VariableID:1:35",
    name: "legacy/old",
    variableCollectionId: T,
    resolvedType: "COLOR",
    valuesByMode: { "2:0": { r: 1, g: 0, b: 0, a: 1 } },
    deletedButReferenced: true,
  }),
  variable({
    id: "VariableID:9:1",
    name: "library/red",
    variableCollectionId: R,
    resolvedType: "COLOR",
    valuesByMode: { "9:0": { r: 1, g: 0, b: 0, a: 1 } },
    remote: true,
  }),
];

export const fixture = {
  status: 200,
  error: false,
  meta: {
    variables: Object.fromEntries(variables.map((entry) => [entry.id, entry])),
    variableCollections: {
      [P]: {
        id: P,
        name: "Primitives",
        key: "key-primitives",
        modes: [{ modeId: "1:0", name: "Value" }],
        defaultModeId: "1:0",
        remote: false,
        hiddenFromPublishing: false,
        variableIds: variables.filter((entry) => entry.variableCollectionId === P).map((entry) => entry.id),
      },
      [T]: {
        id: T,
        name: "Theme",
        key: "key-theme",
        modes: [
          { modeId: "2:0", name: "Light" },
          { modeId: "2:1", name: "Dark" },
        ],
        defaultModeId: "2:0",
        remote: false,
        hiddenFromPublishing: false,
        variableIds: variables.filter((entry) => entry.variableCollectionId === T).map((entry) => entry.id),
      },
      [R]: {
        id: R,
        name: "Library",
        key: "key-library",
        modes: [{ modeId: "9:0", name: "Default" }],
        defaultModeId: "9:0",
        remote: true,
        hiddenFromPublishing: false,
        variableIds: ["VariableID:9:1"],
      },
    },
  },
} satisfies GetLocalVariablesResponse;
