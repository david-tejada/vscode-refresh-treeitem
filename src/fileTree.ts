import * as vscode from "vscode";

export class Entry extends vscode.TreeItem {
  resourceUri: vscode.Uri;
  type: vscode.FileType;
  parent: Entry | undefined;

  constructor(
    resourceUri: vscode.Uri,
    collapsibleState: vscode.TreeItemCollapsibleState,
    type: vscode.FileType,
    parent: Entry | undefined
  ) {
    super(resourceUri, collapsibleState);
    this.resourceUri = resourceUri;
    this.type = type;
    this.parent = parent;
  }
}

class FileDataProvider implements vscode.TreeDataProvider<Entry> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<
    Entry | undefined
  > = new vscode.EventEmitter<Entry | undefined>();

  readonly onDidChangeTreeData: vscode.Event<Entry | undefined> =
    this._onDidChangeTreeData.event;

  constructor() {}

  refresh(entry: Entry) {
    this._onDidChangeTreeData.fire(entry);
  }

  async getChildren(entry?: Entry) {
    const rootUri = entry
      ? entry.resourceUri
      : vscode.workspace.workspaceFolders![0].uri;
    const children = await vscode.workspace.fs.readDirectory(rootUri);

    children.sort((a, b) => {
      if (a[1] === b[1]) {
        return a[0].localeCompare(b[0]);
      }
      return a[1] === vscode.FileType.Directory ? -1 : 1;
    });

    return children.map(([name, type]) => {
      const uri = vscode.Uri.joinPath(rootUri, name);

      let collapsibleState =
        type === vscode.FileType.Directory
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None;

      const childEntry = new Entry(uri, collapsibleState, type, entry);

      return childEntry;
    });
  }

  getTreeItem(entry: Entry): vscode.TreeItem {
    return entry;
  }

  getParent(entry: Entry) {
    return entry.parent;
  }
}

export class FileExplorer {
  treeDataProvider: FileDataProvider;
  treeView: vscode.TreeView<Entry>;

  constructor(context: vscode.ExtensionContext) {
    this.treeDataProvider = new FileDataProvider();
    this.treeView = vscode.window.createTreeView("fileExplorer", {
      treeDataProvider: this.treeDataProvider,
    });

    context.subscriptions.push(this.treeView);
  }

  async refresh(entry: Entry) {
    try {
      this.treeDataProvider.refresh(entry);
    } catch (error) {
      console.error(error);
    }
  }
}
