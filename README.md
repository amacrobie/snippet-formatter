# Snippet Formatter

Two commands to make creating VS Code snippets faster — both available in the right-click context menu whenever text is selected.

---

## Commands

### Snippet Formatter: Format Selection

Transforms the selected text in-place into lines ready to paste manually into a snippet `body` array.

For each selected line it:
1. Escapes backslashes (`\` → `\\`)
2. Escapes double quotes (`"` → `\"`)
3. Wraps the line in double quotes and appends a comma

Empty lines become `"",`.

**Example — before:**
```
Hello "world"
path\to\file
```
**After:**
```
"Hello \"world\"",
"path\\to\\file",
```

**Shortcut:** `Ctrl+Shift+Alt+Q`

The selection is replaced in-place. Paste the result directly into a snippet `body` array in any `.code-snippets` or `.json` file.

---

### Snippet Formatter: Add as Snippet

Writes the selected text directly into an existing snippet file as a new snippet entry, without any manual editing of JSON.

**Steps:**

1. Select the text you want to save as a snippet.
2. Right-click → **Snippet Formatter: Add as Snippet**.
3. A quick-pick list of your snippet files appears (styled identically to VS Code's built-in snippet selector — global `.code-snippets` files shown as `name (global)`, language files shown as `languageId (Display Name)`). Choose the target file.
4. Enter a **description** — used as the snippet key. Duplicate descriptions are rejected with a validation message.
5. Enter a **prefix** — the trigger shorthand. Duplicate prefixes are rejected with a validation message.
6. The snippet is written to the file immediately. A confirmation message is shown.

**Notes:**
- If the selected text does not already contain a `$0` tabstop, one is appended automatically as the final body line.
- The target file is parsed as JSONC (comments and trailing commas are handled correctly).
- Cancelling at any step silently aborts with no changes made.

---

## Install

1. Locate `snippet-formatter-0.1.9.vsix`
2. Open VS Code → Extensions panel → `···` menu → **Install from VSIX…**
3. Select the `.vsix` file and reload when prompted

## Build from source

Requires [Node.js](https://nodejs.org) and `@vscode/vsce`:

```bash
npm install -g @vscode/vsce
cd snippet-formatter
npm install
vsce package --allow-missing-repository
```

This produces `snippet-formatter-<version>.vsix`.
