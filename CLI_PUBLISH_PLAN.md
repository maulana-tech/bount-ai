# bount-AI CLI: Publication & Execution Plan

This plan details the steps required to publish the developer CLI tool (`skill`) to the public `npm` registry, allowing other developers to run it globally from any directory on their machines.

---

## 1. Prepare `package.json`
To make the package public and publishable, we need to modify the private status and define a unique name.

- **File**: `packages/cli/package.json`
- **Modifications**:
  - Remove `"private": true` (or change to `"private": false`).
  - Rename the package from `@concierge/cli` to a unique name, e.g., `bount-ai-cli` or `bount-ai-skill` (already updated in package.json to `bount-ai-cli`).

```json
{
  "name": "bount-ai-cli",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "bin": {
    "skill": "./dist/cli.js"
  },
  ...
}
```

---

## 2. Compilation
Before publishing, compile the TypeScript code inside the CLI package:

```bash
pnpm --filter bount-ai-cli build
```

---

## 3. Log In to npm
Make sure your terminal session is authenticated with your npm registry account:

```bash
npm login
```

---

## 4. Publish to Registry
Navigate into the CLI workspace directory and publish it:

```bash
cd packages/cli
npm publish --access public
```

---

## 5. Verification
Other developers will now be able to download and execute the CLI from any folder on their computer using `npx` (referencing the name you chose in step 1):

```bash
npx bount-ai-cli login
```

---

## 6. Future Updates
When you make updates to the CLI code:
1. Make your changes in `packages/cli/src/`.
2. Bump the `"version"` field in `packages/cli/package.json` (e.g. `"0.1.1"`).
3. Re-run the compile step.
4. Run `npm publish --access public`.
