import * as vscode from "vscode";
import * as prettier from "prettier";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "heredoc-graphql-formatter.formatHeredoc",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
      }

      const document = editor.document;
      const text = document.getText();

      // Regex pour trouver les blocs <<~GRAPHQL ... GRAPHQL
      const regex = /<<~GRAPHQL([\s\S]*?)GRAPHQL/g;

      // Appliquer le formatage Prettier au contenu des blocs
      const promises = [];
      const matches = text.matchAll(regex);

      for (const match of matches) {
        const [fullMatch, graphqlContent] = match;
        promises.push(
          prettier
            .format(graphqlContent, { parser: "graphql" })
            .then((formatted) => ({
              fullMatch,
              replacement: `<<~GRAPHQL\n${formatted
                .trim()
                .split("\n")
                .map((line) => `  ${line}`)
                .join("\n")}\nGRAPHQL`,
            }))
        );
      }

      const results = await Promise.all(promises);
      let formattedText = text;
      for (const { fullMatch, replacement } of results) {
        formattedText = formattedText.replace(fullMatch, replacement);
      }

      // Remplacer le contenu de l'éditeur
      const edit = new vscode.WorkspaceEdit();
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );

      edit.replace(document.uri, fullRange, formattedText);
      vscode.workspace.applyEdit(edit);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
