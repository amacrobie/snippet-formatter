// @ts-check
'use strict';

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const jsonc = require('jsonc-parser');

/**
 * Escapes a single line for use inside a VS Code snippet body string value:
 *   1. Escape backslashes:  \  →  \\
 *   2. Escape double quotes: "  →  \"
 *
 * @param {string} line
 * @returns {string}
 */
function escapeLine(line) {
    return line
        .replace(/\\/g, '\\\\')   // backslash first
        .replace(/"/g, '\\"');    // then double quotes
}

/**
 * Transforms a single line of text into a VS Code snippet body string:
 *   1. Escape via escapeLine()
 *   2. Wrap in double quotes and append a comma: line  →  "line",
 * Empty lines become "",
 *
 * @param {string} line
 * @returns {string}
 */
function transformLine(line) {
    return '"' + escapeLine(line) + '",';
}

/**
 * Look up the display name for a language ID by scanning installed extension
 * manifests — the same source VS Code uses for its own snippet picker.
 *
 * @param {string} languageId
 * @returns {string}
 */
function getLanguageDisplayName(languageId) {
    for (const ext of vscode.extensions.all) {
        const langs =
            ext.packageJSON &&
            ext.packageJSON.contributes &&
            ext.packageJSON.contributes.languages;
        if (Array.isArray(langs)) {
            for (const lang of langs) {
                if (
                    lang.id === languageId &&
                    Array.isArray(lang.aliases) &&
                    lang.aliases.length > 0
                ) {
                    return lang.aliases[0];
                }
            }
        }
    }
    return languageId;
}

/**
 * Build the quick-pick items for the snippet file selector by reading
 * %APPDATA%\Code\User\snippets.
 *
 * @returns {{ label: string, description: string, fsPath: string }[]}
 */
function buildSnippetPickItems() {
    const appData = process.env.APPDATA;
    if (!appData) {
        return [];
    }
    const snippetsFolder = path.join(appData, 'Code', 'User', 'snippets');
    let entries;
    try {
        entries = fs.readdirSync(snippetsFolder);
    } catch (_) {
        return [];
    }

    return entries
        .filter(function (name) {
            return name.endsWith('.code-snippets') || name.endsWith('.json');
        })
        .map(function (name) {
            const fsPath = path.join(snippetsFolder, name);
            if (name.endsWith('.code-snippets')) {
                const stem = name.slice(0, -'.code-snippets'.length);
                return { label: stem, description: 'global', fsPath };
            } else {
                const stem = name.slice(0, -'.json'.length);
                const displayName = getLanguageDisplayName(stem);
                return { label: stem, description: displayName, fsPath };
            }
        });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const formatDisposable = vscode.commands.registerCommand(
        'snippetFormatter.formatForSnippet',
        function () {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            if (selection.isEmpty) {
                vscode.window.showWarningMessage('Snippet Formatter: No text selected.');
                return;
            }

            const selectedText = editor.document.getText(selection);
            const lines = selectedText.split(/\r?\n/);
            const transformed = lines.map(transformLine).join('\n');

            editor.edit(function (editBuilder) {
                editBuilder.replace(selection, transformed);
            });
        }
    );

    const addDisposable = vscode.commands.registerCommand(
        'snippetFormatter.addAsSnippet',
        async function () {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            if (selection.isEmpty) {
                vscode.window.showWarningMessage('Snippet Formatter: No text selected.');
                return;
            }

            const selectedText = editor.document.getText(selection);

            // Build the body array — JSON.stringify will handle all escaping,
            // so use the raw lines here (do NOT pre-escape with escapeLine).
            const body = selectedText.split(/\r?\n/);

            // Append a $0 placeholder if not already present in the raw text
            if (!selectedText.includes('$0')) {
                body.push('$0');
            }

            // Prompt user to select a snippet file using a quick pick,
            // styled the same way as VS Code's built-in snippet selector.
            const items = buildSnippetPickItems();
            const picked = await vscode.window.showQuickPick(items, {
                title: 'Select Snippets File',
                matchOnDescription: true,
                placeHolder: 'Select Snippets File or Create Snippets'
            });

            if (!picked) {
                return;
            }

            const filePath = picked.fsPath;

            // Parse the target snippet file (JSONC — may contain comments/trailing commas)
            let data;
            try {
                const raw = fs.readFileSync(filePath, 'utf8');
                const errors = [];
                data = jsonc.parse(raw, errors);
                if (data === null || data === undefined || typeof data !== 'object') {
                    throw new Error('File could not be parsed as a JSON object.');
                }
            } catch (err) {
                vscode.window.showErrorMessage(
                    'Snippet Formatter: Could not read or parse the selected file. ' + String(err)
                );
                return;
            }

            // Prompt for a description (also used as the key)
            const description = await vscode.window.showInputBox({
                prompt: 'Snippet description (used as key)',
                validateInput: function (value) {
                    if (!value || value.trim() === '') {
                        return 'Description must not be empty.';
                    }
                    if (Object.prototype.hasOwnProperty.call(data, value)) {
                        return 'Description already exists in the selected snippet file.';
                    }
                    return null;
                }
            });

            if (description === undefined) {
                return;
            }

            // Prompt for a prefix
            const prefix = await vscode.window.showInputBox({
                prompt: 'Snippet prefix',
                validateInput: function (value) {
                    if (!value || value.trim() === '') {
                        return 'Prefix must not be empty.';
                    }
                    const duplicate = Object.values(data).some(
                        function (entry) {
                            return entry && typeof entry === 'object' && entry.prefix === value;
                        }
                    );
                    if (duplicate) {
                        return 'Prefix is already used in the selected snippet file.';
                    }
                    return null;
                }
            });

            if (prefix === undefined) {
                return;
            }

            // Write the new snippet entry
            data[description] = { prefix, body, description };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

            vscode.window.showInformationMessage(
                'Snippet Formatter: Snippet "' + description + '" added.'
            );
        }
    );

    context.subscriptions.push(formatDisposable, addDisposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
