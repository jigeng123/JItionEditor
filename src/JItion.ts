import * as vscode from 'vscode';
import { html as beautifyHtml } from 'js-beautify';


export class JitionEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new JitionEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(
			JitionEditorProvider.viewType, 
			provider,      
			{
			// JIGENG 切换窗口不会隐藏
        	webviewOptions: { retainContextWhenHidden: true },
      		});
		return providerRegistration;
	}

	private static readonly viewType = 'Jition';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

//JIGENG 当编辑器加载的时候
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// JIGENG 设置初始化webview的html
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview,document.fileName);
//JIGENG 发送update message给webview,附带文件内容
		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}
//JIGENG 接受message from webview
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'save':
					this.updateTextDocument(document,e.text);
					//保存完发送已保存
					webviewPanel.webview.postMessage({
					type: 'saved',
					});
					return;	
			}
		});
//JIGENG 关闭webview的时候执行，将一些后台的东西销毁
		webviewPanel.onDidDispose(() => {
		});
//JIGENG初始化时更新一次
		updateWebview();
	}

// JIGENG html内容
	private getHtmlForWebview(webview: vscode.Webview,fileName:string): string {
		// 加在本地css+js
		const filebasename =  fileName.split("\\").pop() || fileName; 
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media','main.js'));
					const HTMLtoPDFscriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'outjs','html2pdf.bundle.min.js'));
					const MDITscriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'outjs','markdown-it.min.js'));
					const TURNMDscriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'outjs','turndown.min.js'));
		const JitonscriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'jition.js'));

		const MystyleUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'jition.css'));


		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				    <link
					href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css"
					rel="stylesheet"
					/>
					<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
					<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
					

				<link href="${MystyleUri}" rel="stylesheet" />
				<script  src="${HTMLtoPDFscriptUri}"></script>
				<script  src="${MDITscriptUri}"></script>
				<script  src="${TURNMDscriptUri}"></script>
				<title>Jition</title>
			</head>
			<body>
			</div>
			<h1 class="filename">${filebasename}</h1>
			<div id="editor-container">
			<div id="editor"><h1>初始化失败,重新加载</h1></div>
			<div id="statebar"></div>
			</div>
    <!-- 💡💡💡💡💡工具栏💡💡💡💡💡 -->
    <!-- 🎨字体样式窗口 -->
    <div id="floating-toolbar">
      <button id="bold-btn" title="Bold"><b>B</b></button>
      <button id="italic-btn" title="Italic"><i>I</i></button>
      <button id="underline-btn" title="Underline"><u>U</u></button>
      <div
        style="
          width: 1px;
          height: 18px;
          background: rgba(255, 255, 255, 0.12);
          margin: 0 6px;
        "
      ></div>
      <button id="link-btn" title="Link">🔗</button>
      <button id="color-btn" title="Color">
        🎨
        <div id="color-palette"></div>
      </button>
      <button id="clear-format-btn" title="Clear">Tx</button>
    </div>
    <!-- 🔨右下角工具栏 -->
    <div id="fab-container">
      <div aria-hidden="false" id="fab">
        <button id="fab-main" title="工具">+</button>
        <div
          id="fab-menu"
          style="display: none; flex-direction: column; align-items: flex-end"
        >
          <button class="fab-item" id="fab-clear">清空本地</button>
          <button class="fab-item" id="fab-fold">折叠</button>
          <button class="fab-item" id="fab-import">导入 MD</button>
          <button class="fab-item" id="fab-export-md">导出 MD</button>
          <button class="fab-item" id="fab-export-pdf">导出 PDF</button>
          <button class="fab-item" id="fab-clean-all">清空页面</button>
        </div>
      </div>
      <div id="toc-fab">
        <button id="toc-button" title="目录">☰</button>
        <div id="toc-panel">
          <ul id="toc-list"></ul>
        </div>
      </div>
    </div>
				<script  src="${JitonscriptUri}"></script>
				<script  src="${scriptUri}"></script>
			</body>
			</html>`;
	}
//JIGENG 更新文件内容
	private updateTextDocument(document: vscode.TextDocument, text: any) {
		const edit = new vscode.WorkspaceEdit();
		const prettyHtml = beautifyHtml(text, {
                indent_size: 2,
                wrap_line_length: 80,
                end_with_newline: true,
            });
		// TODO 这里直接覆盖源文件，可以优化
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			prettyHtml);

		return vscode.workspace.applyEdit(edit);
	}
}
