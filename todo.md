# 1.1
打开插件
打开ji文件--加载插件
解析一个编辑器来解析ji文件


## 创建一个.ji文件
[文件结构](exampleFiles/测试.ji)
本质是一个html[html源文件](exampleFiles/测试.html)

				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleMainUri}" rel="stylesheet" />
## resolveCustomTextEditor
1. 允许脚本
2. 初始化html
   1. TODO 加载css
   2. 加载jition.js
```html
<div id="editor-container">
<div id="editor"></div>
</div>
```
1. TODO 添加事件
   1. vscode.workspace.onDidChangeTextDocument-[文件更改]
   2. webviewPanel.onDidDispos[关闭编辑器事件]
   3. webviewPanel.webview.onDidReceiveMessage[接受webview的事件]
2. 更新webview--发送一个updtae消息,发送text(文档的text)
3. html中的脚本,关于update的消息的处理
   1. 获得text,根据text更新html内容
      1. 获得editor DOM元素(全局)
      2. 直接将text作为innerHTML加入到editor中
   2. 保存text到vscode--setstate


123123
我去恶趣味
213
123
123
123
TODO 123