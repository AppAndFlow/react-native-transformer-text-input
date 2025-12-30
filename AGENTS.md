# AGENTS

This repository contains a React Native Fabric view + worklet-based transformer for TextInput. Use this file as quick guidance for AI/codegen changes.

## Repo Layout
- `src/`: JS/TS API. Entry point is `src/index.tsx` (barrel).
- `src/Transformer.ts`: `Transformer` class and worklet types.
- `src/TransformerTextInput.tsx`: `TransformerTextInput` component.
- `src/registry.ts`: UI runtime registry for transformer worklets.
- `ios/`: iOS Fabric view + module.
- `android/`: Android Fabric view + JNI bridge.
- `cpp/`: Shared C++ runtime helpers (JSI + worklets).
- `example/`: Example app.

## Architecture Notes
- New Architecture only (Fabric + codegen). Do not add paper/legacy view paths.
- Worklet registry lives on the UI runtime global: `__rntti_registerTransformerRegistry`.
- Shared C++ helpers live in the `rntti` namespace.
- Avoid JSI types in public/shared C++ APIs when possible; keep JSI at edges.
- `SetUIWorkletRuntime` schedules assignment on the UI runtime; no mutex.

## JS API
- Users create `new Transformer(worklet)`; constructor validates worklet.
- `TransformerTextInput` accepts a `Transformer` instance.
- The transformer worklet receives `{ value, previousValue, selection, previousSelection }`.
- Return `null/undefined` for no transform, or `{ value?, selection? }`.

## Native Notes
- iOS uses `RCTConversions` helpers for string bridging.
- C++ transform flow: `LookupTransformer` -> `RunTransformer`.
- Android JNI currently has its own transformer calls; keep in sync with JS contracts.

## Common Commands
- `yarn format:write` (format code before committing)
- `yarn lint` (run linters)
- `yarn test` (run unit tests)
- `yarn prepare` (builds via `bob`)
- `yarn example` (opens example workspace commands)

## Conventions
- Prefer ASCII in source edits.
- Avoid touching generated/build artifacts (`lib/`, `example/ios/Pods/`).
- Keep changes focused and minimal; update README when JS API changes.
