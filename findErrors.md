# 🛠 Build & Diagnostics Guide

This project uses TypeScript and PNPM. Below are recommended commands to build and surface all errors efficiently.

---

## 🚀 Build Command

```bash
pnpm run build
```
⚠️ This will stop at the first fatal error. Use the commands below to catch all issues in one pass.

## ✅ TypeScript Full Check
```bash
pnpm exec tsc --noEmit
```
- Compiles all files without emitting output
- Shows all type errors across the project

## 🔍 Linting for Static Issues
```bash
pnpm exec eslint . --ext .ts,.tsx
```

- Catches unused variables, bad imports, and logic errors
- Configurable to show all issues at once

## 🧠 Framework-Specific Checks

Next.js
```bash
pnpm exec next lint
```

Vite + TypeScript
```bash
pnpm exec vite build --debug
```

Or just:
```bash
pnpm exec tsc --noEmit
```


## 🔁 Live Type Checking (Optional)
Install:
```bash
pnpm add -D tsc-watch
```

Run:
```bash
pnpm exec tsc-watch --noEmit
```

Recompiles and shows errors on every file change


## 🧰 Tips
- Enable [skipLibCheck]() and [incremental]() in [tsconfig.json]() for faster checks:
```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "incremental": true
  }
}
```


Happy debugging! 🧪

---

