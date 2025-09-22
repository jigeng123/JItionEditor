//JIGENG 监听webview发来的updatemessage
window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "update":
      const text = message.text;

      // 渲染内容
      RenderContent(text);

      // 保存到vscode
      vscode.setState({ text });

      return;
  }
});
//JIGENG监听saved，将dirty变flase
window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "saved":
      dirty = false;
      const text = editor.innerHTML;
      vscode.setState({ text });
      return;
  }
});
//JIGENG重新加载时，获得state，并重新渲染

const state = vscode.getState();
if (state) {
  RenderContent(state.text);
}
initColorPalette();
