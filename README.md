# Snippet Formatter

Converts selected text into lines ready to paste into a VS Code snippet `body` array.

## What it does

For each selected line it:
1. Escapes backslashes (`\` → `\\`)
2. Escapes double quotes (`"` → `\"`)
3. Wraps the line in double quotes
4. Appends a comma

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

## Usage

1. Select the text you want to convert
2. Right-click → **Format Selection for VS Code Snippet**
   — or press `Ctrl+Shift+Alt+Q`

The selection is replaced in-place. Paste the result directly into a snippet `body` array.

## Install

1. Download / locate `snippet-formatter-0.0.1.vsix`
2. Open VS Code → Extensions panel → `···` menu (top-right) → **Install from VSIX…**
3. Select the `.vsix` file and reload when prompted

## Build from source

Requires [Node.js](https://nodejs.org) and `vsce`:

```bash
npm install -g @vscode/vsce
cd snippet-formatter
vsce package --allow-missing-publisher
```

This produces `snippet-formatter-0.0.1.vsix`.
