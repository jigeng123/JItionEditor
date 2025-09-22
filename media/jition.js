//JIGENGJIGENG全局变量
// JIGENG加载vscodeAPI
const vscode = acquireVsCodeApi();
//JIGENG 渲染文件内容
function RenderContent(text) {
  // 添加到容器
  editor.innerHTML = text;
}
//JIGENG传递给后端，保存内容
function saveContent() {
  const text = editor.innerHTML || "没找到内容，错误";
  vscode.setState({ text });
  vscode.postMessage({
    type: "save",
    text,
  });
}
//JIGENG全局变量
let dirty = false;
let draggedItem = null;
//ji1 DOMtree
const editor = document.getElementById("editor");
const editorContainer = document.getElementById("editor-container");

const floatingToolbar = document.getElementById("floating-toolbar");

const colorBtn = document.getElementById("color-btn");
const colorPalette = document.getElementById("color-palette");
//ji2 全局事件
//监听代码编辑取消聚焦,执行高亮
editorContainer.addEventListener("focusout", (e) => {
  const code = e.target.closest("code[contenteditable]");
  if (!code) return; // 不是代码编辑块就退出

  // 获取语言
  const lang = code.className.replace("language-", "") || "javascript";

  // 执行 Prism 高亮
  Prism.highlightElement(code);

  // 保存内容
  const block = code.closest(".block");
  if (block) saveEditorState();
});
// 语言切换
editorContainer.addEventListener("change", (e) => {
  const sel = e.target.closest(".code-toolbar select");
  if (!sel) return;

  // 找到对应代码块
  const block = sel.closest(".block");
  const code = block?.querySelector("code[contenteditable]");
  const details = sel.closest("details");

  if (!code) return;

  // 更新语言类名
  const lang = sel.value;
  code.className = "language-" + lang;

  // 存储在 details 的 data-lang（用于恢复状态）
  if (details) details.dataset.lang = lang;

  // 高亮代码并保存
  Prism.highlightElement(code);
  saveContent();
});

// 复制按钮
editorContainer.addEventListener("click", (e) => {
  const btn = e.target.closest(".code-toolbar button");
  if (!btn || btn.textContent !== "Copy") return;

  const block = btn.closest(".block");
  const code = block?.querySelector("code[contenteditable]");
  if (!code) return;

  navigator.clipboard.writeText(code.textContent);
  btn.textContent = "Copied";
  setTimeout(() => (btn.textContent = "Copy"), 1200);
});

editorContainer.addEventListener("click", (e) => {
  const summary = e.target.closest("summary");
  if (!summary) return; // 点击的不是折叠按钮就退出

  e.preventDefault();
});
editorContainer.addEventListener("click", (e) => {
  const toggleBtn = e.target.closest(".toggle-btn");
  if (!toggleBtn) return; // 点击的不是折叠按钮就退出

  e.stopPropagation();

  const details = toggleBtn.closest("details");
  if (details) {
    details.open = !details.open; // 手动切换折叠
    toggleBtn.classList.toggle("open"); // 根据状态旋转
  }
});
editorContainer.addEventListener("input", () => {
  dirty = true;
  saveContent();
});
editor.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return; // 不是删除按钮直接返回

  // 找到对应的 block
  const block = btn.closest(".block");
  if (block) {
    block.remove(); // 删除 DOM
    saveContent(); // 更新保存
    const isHeading = block.dataset.type === "heading";
    const isOlLIST = block.closest("ol");
    if (isOlLIST) {
      updateOrderedListNumbers(parentOl);
    }
    if (isHeading) {
      updateAllHeadingNumbers();
      saveContent();
    } // 如果是 heading，更新编号
  }
});
editorContainer.addEventListener("mousedown", (e) => {
  const handle = e.target.closest(".drag-handle");
  if (!handle) return;
  draggedBlock = handle.closest(".block");
  draggedBlock.dataset._armed = "true";
});
document.addEventListener(
  "mouseup",
  (e) => {
    const handle = e.target.closest(".drag-handle");
    if (!handle) return;
    draggedBlock = handle.closest(".block");
    delete draggedBlock.dataset._armed; // 清除标记
  },
  { capture: true }
);

const BLOCK_TYPES = {
  p: { tag: "p", placeholder: "段落", container: false },
  heading: {
    tag: "h2",
    placeholder: "标题 ",
    container: true,
    isToggle: true,
  },
  blockquote: {
    tag: "blockquote",
    placeholder: "引用",
    container: false,
  },
  ul: {
    tag: "ul",
    placeholder: "无序列表",
    container: true,
    isList: true,
    defaultChild: "li",
    isToggle: true,
  },
  ol: {
    tag: "ol",
    placeholder: "有序列表",
    container: true,
    isList: true,
    defaultChild: "li",
    isToggle: true,
  },
  li: { tag: "li", placeholder: "列表项", container: false },
  task: {
    tag: "task",
    placeholder: "任务列表",
    container: true,
    isTask: true,
    defaultChild: "taskitem",
    isToggle: true,
  },
  taskitem: {
    tag: "taskitem",
    placeholder: "任务项",
    container: false,
    isTaskItem: true,
  },
  table: {
    tag: "div",
    isTable: true,
    placeholder: "表格",
    container: false,
  },
  pre: {
    tag: "div",
    hasCode: true,
    isToggle: true,
    placeholder: "代码块 ",
    container: true,
  },
  img: {
    tag: "div",
    isImage: true,
    placeholder: "图片",
    container: false,
  },
};

const CODE_LANGS = {
  javascript: "JavaScript",
  python: "Python",
  html: "HTML",
  css: "CSS",
  bash: "Bash",
  plaintext: "Plain Text",
};
const PALETTE_COLORS = [
  // 黑白灰
  "#000000",
  "#222222",
  "#444444",
  "#666666",
  "#888888",
  "#999999",
  "#bbbbbb",
  "#cccccc",
  "#eeeeee",
  "#ffffff",

  // 红橙黄
  "#ff4d4f",
  "#ff7875",
  "#ffa39e",
  "#ffc069",
  "#ff9c6e",
  "#faad14",
  "#ffd666",
  "#ffe58f",

  // 绿
  "#52c41a",
  "#73d13d",
  "#95de64",
  "#b7eb8f",
  "#d9f7be",

  // 蓝
  "#1890ff",
  "#40a9ff",
  "#69c0ff",
  "#91d5ff",
  "#bae7ff",

  // 紫
  "#722ed1",
  "#9254de",
  "#b37feb",
  "#d3adf7",
  "#efdbff",

  // 粉
  "#eb2f96",
  "#f759ab",
  "#ff85c0",
  "#ffadd2",
  "#ffd6e7",

  // 棕/暖灰
  "#a0522d",
  "#c08050",
  "#d9a066",
  "#e6c3a0",
  "#f0e0d9",

  // 青绿
  "#13c2c2",
  "#36cfc9",
  "#5cdbd3",
  "#87e8de",
  "#b5f5ec",
];

const cmdMenuState = {
  active: false,
  element: null,
  selectedIndex: 0,
  triggerBlock: null,
  triggerRect: null,
};

const HISTORY_LIMIT = 120;
let history = [],
  historyIndex = -1,
  historyLock = false;

// 防止闪烁跳动
const debounce = (fn, wait = 300) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
};

async function fileToDataURL(file) {
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

//JIGENG添加块

/*
将 createBlock 重构为多个小函数，便于理解与测试。
假设全局存在：BLOCK_TYPES, CODE_LANGS, Prism(高亮), debounce, saveContent, updateAllHeadingNumbers
*/

// --- helpers 工具函数 -----------------------------------------------------
// 创建拖拽手柄
function createDragHandle() {
  const handle = document.createElement("div");
  handle.className = "drag-handle";
  handle.innerText = "⠿";
  return handle;
}

// 创建删除按钮（可传入提示文字和点击回调）
function createDeleteBtn({ title = "删除此块" }) {
  const del = document.createElement("button");
  del.className = "delete-btn";
  del.innerText = "×";
  del.title = title;
  return del;
}

// 创建通用的可编辑内容元素
function makeContentElement(
  tag = "div",
  type = "p",
  html = "",
  placeholder = ""
) {
  const el = document.createElement(tag);
  el.className = "content";
  el.setAttribute("contenteditable", "true"); // 可编辑
  el.dataset.type = type; // 数据属性存储类型
  el.innerHTML = html || "";
  if (placeholder) el.dataset.placeholder = placeholder;
  // 输入事件触发保存（防抖处理）
  el.addEventListener(
    "input",
    debounce(() => saveContent(), 300)
  );
  return el;
}

// --- 具体类型的 block 构建函数 --------------------------------------------
// 段落类 block
function block_p(
  type,
  content,
  options,
  def,
  parentForContent,
  parentForChildren
) {
  const tag = def.tag || "div";
  const el = makeContentElement(
    tag,
    type,
    options.content || content || "",
    def.placeholder || ""
  );
  parentForContent.appendChild(el);
  return el;
}
//有序列表自动更新序号
function updateOrderedListNumbers(ol) {
  [...ol.children].forEach((li, idx) => {
    const bullet = li.querySelector(".list-bullet");
    if (bullet) bullet.textContent = `${idx + 1}.`;
  });
}
// 通用列表项构建函数（供无序/有序/任务列表复用）
function _createListItemBase(type, content, options) {
  const li = document.createElement("li");
  li.className = "block";
  li.dataset.type = type;
  li.setAttribute("draggable", "true");

  const wrapper = document.createElement("div");
  wrapper.className = "block-content-wrapper";
  const handle = createDragHandle();
  wrapper.appendChild(handle);

  // 任务项增加复选框
  if (type === "taskitem") {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = options.checked === true;
    wrapper.appendChild(checkbox);
  }

  // 列表项增加标记
  if (type === "li") {
    const bullet = document.createElement("span");
    bullet.className = "list-bullet";

    const parentContainer = options.parentContainer || null;
    if (parentContainer?.tagName?.toLowerCase() === "ol") {
      // 有序列表，先用临时数字，插入后 updateOrderedListNumbers 会更新
      bullet.textContent = "1.";
    } else {
      bullet.textContent = "•"; // 无序列表
    }

    wrapper.appendChild(bullet);
  }

  // 列表项的内容区域
  const contentEl = document.createElement("div");
  contentEl.className = "content";
  contentEl.setAttribute("contenteditable", "true");
  contentEl.dataset.type = type;
  contentEl.innerHTML = options.content || content || "";
  contentEl.dataset.placeholder =
    (BLOCK_TYPES[type] && BLOCK_TYPES[type].placeholder) || "";

  wrapper.appendChild(contentEl);
  li.appendChild(wrapper);

  // 删除按钮
  const del = createDeleteBtn({
    title: "删除此项",
  });
  wrapper.appendChild(del);

  // 输入事件保存
  contentEl.addEventListener(
    "input",
    debounce(() => saveContent(), 300)
  );
  // 拖拽处理

  return li;
}

// 引用块
function block_blockquote(type, content, options, def, parentForContent) {
  const tag = def.tag || "blockquote";
  const el = makeContentElement(
    tag,
    type,
    options.content || content || "",
    def.placeholder || ""
  );
  parentForContent.appendChild(el);
  return el;
}

// 图片块
function block_img(type, content, options, parentForContent) {
  const imgWrap = document.createElement("div");
  imgWrap.className = "img-block";
  const img = document.createElement("img");
  img.src =
    options.src ||
    content ||
    "https://via.placeholder.com/600x120.png?text=Image";
  img.alt = options.alt || "image";
  imgWrap.appendChild(img);
  parentForContent.appendChild(imgWrap);
  return imgWrap;
}

// 标题块
function block_heading(type, content, options, parentForContent) {
  const level = options.level || 2;
  const tag = `h${level}`;
  const el = makeContentElement(
    tag,
    type,
    options.content || content || "",
    (BLOCK_TYPES[type] && BLOCK_TYPES[type].placeholder) || ""
  );
  el.dataset.level = level;

  const num = document.createElement("span");
  num.className = "heading-number";
  parentForContent.insertBefore(
    num,
    parentForContent.querySelector(".drag-handle").nextSibling
  );
  parentForContent.appendChild(el);
  return el;
}

// 代码块
function block_pre(
  type,
  content,
  options,
  parentForChildren,
  parentForContent,
  summary
) {
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  const lang = options.lang || "javascript";
  code.className = "language-" + lang;
  code.setAttribute("contenteditable", "true");
  code.dataset.placeholder = "请输入代码...";
  pre.appendChild(code);

  // 工具栏（语言选择、复制按钮）
  const toolbar = document.createElement("div");
  toolbar.className = "code-toolbar";
  const sel = document.createElement("select");
  for (const k in CODE_LANGS) sel.add(new Option(CODE_LANGS[k], k));
  sel.value = lang;

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";

  toolbar.appendChild(sel);
  toolbar.appendChild(copyBtn);

  // 工具栏插入位置：toggle 块时放到 summary，否则放到 parentForContent
  if (summary) summary.appendChild(toolbar);
  else if (parentForContent) parentForContent.appendChild(toolbar);

  if (parentForChildren) parentForChildren.appendChild(pre);
  if (parentForChildren && parentForChildren.dataset)
    parentForChildren.dataset.lang = lang;
  return pre;
}

// 表格块
function block_table(type, content, options, block) {
  const tbWrap = document.createElement("div");
  tbWrap.className = "table-block";
  const table = document.createElement("table");
  table.innerHTML =
    options.tableContent ||
    `<thead><tr><th contenteditable="true"></th></tr></thead><tbody><tr><td contenteditable="true"></td></tr></tbody>`;
  tbWrap.appendChild(table);
  block.appendChild(tbWrap);
  const controls = document.createElement("div");
  controls.className = "table-controls";
  controls.innerHTML = `<button class="add-row">添加行</button><button class="add-col">添加列</button><button class="del-row">删除行</button><button class="del-col">删除列</button>`;
  block.appendChild(controls);
  return tbWrap;
}

// --- 主工厂函数 ----------------------------------------------------------
function createBlock(type = "p", content = "", options = {}) {
  const def = BLOCK_TYPES[type];
  if (!def) return null; // 未定义的类型直接返回 null

  // 列表项（li 或 taskitem）单独返回 <li>
  if (type === "li" || type === "taskitem") {
    return _createListItemBase(type, content, options);
  }

  const block = document.createElement("div");
  block.className = "block";
  block.dataset.type = type;
  block.setAttribute("draggable", "true");

  // 根据类型添加样式标记
  if (def.isList && type === "ul") block.classList.add("list-block-ul");
  if (def.isList && type === "ol") block.classList.add("list-block-ol");
  if (def.isTask && type === "task") block.classList.add("list-block-task");

  const wrapper = document.createElement("div");
  wrapper.className = "block-content-wrapper";
  const handle = createDragHandle();

  let details, summary, parentForContent, parentForChildren;
  const isToggle = !!def.isToggle;

  // toggle 块使用 <details>/<summary> 包裹
  if (isToggle) {
    block.classList.add("details-block");
    details = document.createElement("details");
    details.open = options.openState !== false;
    summary = document.createElement("summary");

    wrapper.appendChild(handle);
    summary.appendChild(wrapper);
    // 创建折叠按钮
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-btn";
    toggleBtn.textContent = "▶";
    summary.insertBefore(toggleBtn, wrapper);
    details.appendChild(summary);
    block.appendChild(details);

    parentForContent = wrapper;
    parentForChildren = details;
  } else {
    wrapper.appendChild(handle);
    block.appendChild(wrapper);
    parentForContent = wrapper;
    parentForChildren = block;
  }

  // 删除按钮（删除时更新标题序号并保存）
  const del = createDeleteBtn({
    title: "删除此块",
  });

  // 根据不同类型调用具体构建函数
  if (def.hasCode) {
    block.classList.add("pre-block");
    block_pre(
      type,
      content,
      options,
      parentForChildren,
      parentForContent,
      summary
    );
  } else if (def.isImage) {
    block_img(type, content, options, parentForContent);
  } else if (def.isTable) {
    block_table(type, content, options, block);
  } else if (!def.isList && !def.isTask) {
    if (type === "heading") {
      block_heading(type, content, options, parentForContent);
    } else if (type === "blockquote") {
      block_blockquote(type, content, options, def, parentForContent);
    } else {
      block_p(type, content, options, def, parentForContent, parentForChildren);
    }
  }

  // 容器类 block（可包含子块）
  if (def.container) {
    let containerEl;
    if (def.isList || def.isTask) containerEl = document.createElement(def.tag);
    else containerEl = document.createElement("div");
    containerEl.className = "block-children";
    parentForChildren.appendChild(containerEl);

    // 递归创建子块
    if (Array.isArray(options.children)) {
      options.children.forEach((ch) => {
        const childNode = createBlock(ch.type, ch.content || "", ch);
        if (childNode) containerEl.appendChild(childNode);
      });
    }
  }

  wrapper.appendChild(del);

  return block;
}

/*
说明：
- 此重构保持了原有 DOM 结构和事件绑定，但将职责拆分为更小的函数。
- 一些全局依赖（BLOCK_TYPES, CODE_LANGS, Prism, debounce, saveContent, updateAllHeadingNumbers）需要外部提供。
- 可以进一步拆分为 ES 模块，或增加 TypeScript 类型、Jest 单元测试。
*/

//JIGENG添加快-菜单

function createAddMenu(
  parentContainer,
  beforeElement = null,
  isCmd = false,
  e = null
) {
  closeAllMenus();
  const menu = document.createElement("div");
  menu.className = "add-menu";
  const types = [
    "p",
    "heading",
    "blockquote",
    "ul",
    "ol",
    "task",
    "table",
    "pre",
    "img",
  ];
  types.forEach((t) => {
    const btn = document.createElement("button");
    btn.textContent = BLOCK_TYPES[t].placeholder || t;
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      let nb = createBlock(
        t,
        "",
        t === "img" ? { src: "https://via.placeholder.com/600x120.png" } : {}
      );

      if (BLOCK_TYPES[t].isList || BLOCK_TYPES[t].isTask) {
        const firstItem = createBlock(BLOCK_TYPES[t].defaultChild, "");
        nb.querySelector(".block-children").appendChild(firstItem);
      }

      if (isCmd && cmdMenuState.triggerBlock) {
        cmdMenuState.triggerBlock.insertAdjacentElement("afterend", nb);
      } else {
        parentContainer.insertBefore(nb, beforeElement);
      }

      if (t === "img") {
        const url = prompt(
          "图片 URL（留空取消）",
          "https://via.placeholder.com/600x120.png"
        );
        if (url) {
          nb.querySelector("img").src = url;
        } else {
          nb.remove();
          menu.remove();
          closeAllMenus();
          return;
        }
      }

      setTimeout(() => {
        const focusTarget = nb.querySelector(".content, code, td, img");
        if (focusTarget && focusTarget.focus) focusTarget.focus();
      }, 20);

      updateAllHeadingNumbers();
      saveContent();
      menu.remove();
      closeAllMenus();
    });
    menu.appendChild(btn);
  });
  menu.addEventListener("mousedown", (e) => e.stopPropagation());
  menu.addEventListener("click", (e) => e.stopPropagation());
  document.body.appendChild(menu);
  // 计算初始位置
  let left = 0;
  let top = 0;

  if (isCmd && cmdMenuState.triggerRect) {
    left = cmdMenuState.triggerRect.left;
    top = cmdMenuState.triggerRect.bottom + 6;
    cmdMenuState.active = true;
    cmdMenuState.element = menu;
    cmdMenuState.selectedIndex = 0;
    updateCmdMenuSelection();
  } else if (e) {
    left = e.clientX + 4;
    top = e.clientY + 4;
  } else {
    const rect = beforeElement
      ? beforeElement.getBoundingClientRect()
      : parentContainer.getBoundingClientRect();
    top = beforeElement ? rect.top : rect.bottom;
    left = rect.left + 12;
  }

  // 获取菜单尺寸和窗口尺寸
  const menuRect = menu.getBoundingClientRect();
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  // 防止超出右边界
  if (left + menuRect.width > winWidth) {
    left = winWidth - menuRect.width - 4;
  }
  // 防止超出下边界
  if (top + menuRect.height > winHeight) {
    top = winHeight - menuRect.height - 4;
  }
  // 防止超出左边界
  if (left < 0) left = 4;
  // 防止超出上边界
  if (top < 0) top = 4;

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  return menu;
}

function closeAllMenus() {
  document.querySelectorAll(".add-menu").forEach((m) => m.remove());
  if (cmdMenuState.active) {
    cmdMenuState.active = false;
    cmdMenuState.element = null;
    cmdMenuState.triggerBlock = null;
    cmdMenuState.triggerRect = null;
    cmdMenuState.selectedIndex = 0;
  }
}
function updateCmdMenuSelection() {
  if (!cmdMenuState.active || !cmdMenuState.element) return;
  const opts = cmdMenuState.element.querySelectorAll("button");
  opts.forEach(
    (o, i) =>
      (o.style.background = i === cmdMenuState.selectedIndex ? "#eef" : "")
  );
}

//JIGENG拖拽块功能

//拖拽功能
// 全局变量
// 用于存储当前正在拖动的块元素（.block）。
// 拖动开始时赋值，拖动结束后清空。

// 拖拽开始
// e.target.closest(".block")：找到触发拖动事件的 .block 父元素。
// 条件 dataset._armed === "true"：才能被拖动（防止误拖）。
// draggedItem = targetBlock：记录拖动的元素。
// setTimeout(function, delay);setTimeout异步执行的函数,class添加dragging,0秒后执行
// 避免阻塞拖动事件触发。
// 如果元素父级没有block，调用 e.preventDefault() 阻止拖动。
editor.addEventListener("dragstart", (e) => {
  const targetBlock = e.target.closest(".block");
  if (targetBlock && targetBlock.dataset._armed === "true") {
    draggedItem = targetBlock;
    setTimeout(() => draggedItem.classList.add("dragging"), 0);
  } else {
    if (targetBlock) e.preventDefault();
  }
});
// 拖动结束：dragend
// 移除 dragging 样式
// 清空 draggedItem
// 删除页面中所有的临时 drop-indicator（拖放指示线）
// 保存编辑器状态 saveContent()
// 更新标题编号 updateAllHeadingNumbers()
editor.addEventListener("dragend", () => {
  if (draggedItem) {
    draggedItem.classList.remove("dragging");
    draggedItem = null;
    document.querySelectorAll(".drop-indicator").forEach((i) => i.remove());
    saveContent();
    updateAllHeadingNumbers();
  }
});
// dragover(拖动中) ，浏览器默认不允许 drop，要 e.preventDefault()
// 删除已有的 drop-indicator
// dropZone：当前鼠标所在可放置区域（.block-children 或 #editor）
editor.addEventListener("dragover", (e) => {
  e.preventDefault(); //允许 drop
  document.querySelectorAll(".drop-indicator").forEach((i) => i.remove());
  // 判断拖放是否合法：
  const dropZone = e.target.closest(".block-children, #editor");
  if (!dropZone || !draggedItem || draggedItem.contains(dropZone)) return;
  //设置特殊拖拽区域,ul和ol列表项
  //如果是列表项区域,但不是列表元素,直接返回
  //如果不是列表区域,是列表项,但不是editor直接返回
  const isListDropZone = dropZone.tagName === "UL" || dropZone.tagName === "OL";
  const isListItem =
    draggedItem.dataset.type === "li" ||
    draggedItem.dataset.type === "taskitem";
  if (isListDropZone && !isListItem) return;
  if (!isListDropZone && isListItem && dropZone.id !== "editor") return;
  // getDragAfterElement() 计算鼠标位置应该插入的位置
  const after = getDragAfterElement(dropZone, e.clientY);
  if (dropZone.children.length === 0 || after == null) {
    dropZone.appendChild(draggedItem);
  } else {
    dropZone.insertBefore(draggedItem, after);
  }
  const ind = document.createElement("div");
  // 创建一个 drop-indicator（提示线）显示拖放位置
  ind.className = "drop-indicator";
  if (after == null) dropZone.appendChild(ind);
  else dropZone.insertBefore(ind, after);
});
// drop放下元素
// 如果拖入的是 图片文件：
// 用 fileToDataURL() 转成 Base64
// 创建一个新的 img block
// 插入到 dropZone 中对应位置
// 否则拖动 已有块
// 同样用 getDragAfterElement() 确定位置插入
// 更新标题编号并保存状态
editor.addEventListener("drop", async (e) => {
  if (
    // 文件拖入图片处理
    e.dataTransfer &&
    e.dataTransfer.files &&
    e.dataTransfer.files.length
  ) {
    const files = Array.from(e.dataTransfer.files);
    const images = files.filter((f) => f.type && f.type.startsWith("image/"));
    if (images.length) {
      e.preventDefault();
      const dropZone = e.target.closest(".block-children, #editor");
      const after = getDragAfterElement(dropZone, e.clientY);
      for (const imgFile of images) {
        const dataUrl = await fileToDataURL(imgFile);
        const imgBlock = createBlock("img", "", { src: dataUrl });
        if (after == null) dropZone.appendChild(imgBlock);
        else dropZone.insertBefore(imgBlock, after);
      }
      saveContent();
      return;
    }
  }
  // 普通拖放块逻辑
  e.preventDefault();
  document.querySelectorAll(".drop-indicator").forEach((i) => i.remove());
  const dropZone = e.target.closest(".block-children, #editor");
  if (!dropZone || !draggedItem || draggedItem.contains(dropZone)) return;
  const isListDropZone = dropZone.tagName === "UL" || dropZone.tagName === "OL";
  const isListItem =
    draggedItem.dataset.type === "li" ||
    draggedItem.dataset.type === "taskitem";
  if (isListDropZone && !isListItem) return;
  if (!isListDropZone && isListItem && dropZone.id !== "editor") return;
  const after = getDragAfterElement(dropZone, e.clientY);
  if (after == null) dropZone.appendChild(draggedItem);
  else dropZone.insertBefore(draggedItem, after);
  updateAllHeadingNumbers();
  saveContent();
});
// 作用：根据鼠标 y 坐标，找出拖动时应该插入在 哪个元素前面
//container：拖动区域的容器,y为鼠标垂直位置
// 排除当前正在拖动的元素（dragging）
// 用 reduce 找出距离鼠标最近的元素
function getDragAfterElement(container, y) {
  const children = [
    //找到container内所有block,[]转换为列表
    ...container.querySelectorAll(":scope > .block, :scope > li.block"),
  ].filter((el) => !el.classList.contains("dragging"));
  //排除class中有dragging的(当前拖拽元素)
  return children.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset)
        return { offset, element: child };
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

//JIGENG富文本编辑功能

//富文本功能
let currentRange = null; // 存储用户选择的文本范围
editorContainer.addEventListener("mouseup", () => {
  setTimeout(() => {
    // 延迟执行以确保浏览器正确获取选区
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && editor.contains(sel.anchorNode)) {
      // ✅ 判断选中文本是否在指定元素内部,不生效
      const invalidElements = editor.querySelectorAll("code, code span");
      for (let el of invalidElements) {
        if (el.contains(sel.anchorNode)) return;
      }
      // 保存选区
      currentRange = sel.getRangeAt(0).cloneRange();
      const rect = currentRange.getBoundingClientRect();
      // 定位工具栏
      floatingToolbar.style.left = `${
        rect.left +
        window.scrollX +
        rect.width / 2 -
        floatingToolbar.offsetWidth / 2
      }px`;
      floatingToolbar.style.top = `${
        rect.top + window.scrollY - floatingToolbar.offsetHeight - 8
      }px`;
      floatingToolbar.style.display = "flex";
    } else {
      floatingToolbar.style.display = "none";
      colorPalette.classList.remove("visible");
    }
  }, 10);
});
document.addEventListener("mousedown", (e) => {
  // 判断点击是否在工具栏
  if (!floatingToolbar.contains(e.target)) {
    // 1️⃣ 清空选区
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();

    // 2️⃣ 移除选中文本高亮（如果你是用 class 来高亮）
    const highlighted = editorContainer.querySelectorAll(".highlight");
    highlighted.forEach((el) => el.classList.remove("highlight"));

    // 3️⃣ 隐藏浮动工具栏和颜色面板
    floatingToolbar.style.display = "none";
    colorPalette.classList.remove("visible");

    // 重置 currentRange
    currentRange = null;
  }
});
function initColorPalette() {
  PALETTE_COLORS.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.className = "color-swatch";
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    colorPalette.appendChild(swatch);
  });
}
colorBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  colorPalette.classList.toggle("visible");
});
colorPalette.addEventListener("click", (e) => {
  if (e.target.classList.contains("color-swatch")) {
    e.stopPropagation();
    const color = e.target.dataset.color;
    applyFormat("foreColor", color);
    colorPalette.classList.remove("visible");
  }
});

function applyFormat(cmd, val = null) {
  if (!currentRange) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(currentRange);
  document.execCommand(cmd, false, val);
  floatingToolbar.style.display = "none";
  currentRange = null;
  saveContent();
}
document
  .getElementById("bold-btn")
  .addEventListener("click", () => applyFormat("bold"));
document
  .getElementById("italic-btn")
  .addEventListener("click", () => applyFormat("italic"));
document
  .getElementById("underline-btn")
  .addEventListener("click", () => applyFormat("underline"));
document.getElementById("clear-format-btn").addEventListener("click", () => {
  applyFormat("removeFormat");
  applyFormat("unlink");
});
document.getElementById("link-btn").addEventListener("click", () => {
  if (!currentRange) return;
  const url = prompt("输入链接 URL:", "https://");
  if (url) applyFormat("createLink", url);
});

//JIGENG命令面板快捷键

function detectBackticksAtCaret() {
  const sel = window.getSelection();
  if (!sel.isCollapsed || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);

  const node = range.startContainer;

  const offset = range.startOffset;

  if (node.nodeType !== Node.TEXT_NODE) return false;

  const textBeforeCaret = node.textContent.substring(0, offset);
  //endwith是光标,如果光标前是-=,则触发工具面板
  if (textBeforeCaret.endsWith("-=")) {
    const contentEl = node.parentElement.closest(".content");
    if (!contentEl) return false;

    const block = contentEl.closest(".block, li.block");
    if (!block) return false;

    // 1️⃣ 在删除 -= 之前就获取光标矩形
    const rect = range.getBoundingClientRect();

    // 2️⃣ 然后删除 -=
    const newRange = document.createRange();
    newRange.setStart(node, offset - 2);
    newRange.setEnd(node, offset);
    newRange.deleteContents();

    // 3️⃣ 更新菜单状态并创建菜单
    cmdMenuState.triggerBlock = block;
    cmdMenuState.triggerRect = rect; // ← 使用删除前的位置
    cmdMenuState.selectedIndex = 0;

    const menu = createAddMenu(
      block.parentElement,
      block.nextElementSibling,
      true
    );

    cmdMenuState.active = true;
    cmdMenuState.element = menu;
    updateCmdMenuSelection();

    return true;
  }

  return false;
}
editor.addEventListener("input", (e) => {
  detectBackticksAtCaret();
});

//JIGENG快捷键

// ✅ 功能总结：
// 撤销/重做
// Mac: Cmd+Z 撤销，Cmd+Shift+Z 重做
// Windows: Ctrl+Z 撤销，Ctrl+Y 重做
// 命令菜单快捷键
// ArrowDown/ArrowUp: 移动菜单高亮
// Enter: 执行选中菜单项
// Escape: 关闭菜单
// Shift+Enter 聚焦控制
// 在内容块内按 Shift+Enter 会取消焦点，而不是换行

// 监听全局按键事件
document.addEventListener("keydown", (e) => {
  // 判断当前系统是否为 Mac
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  // 根据系统选择修饰键：Mac 用 metaKey（⌘），非 Mac 用 ctrlKey
  const mod = isMac ? e.metaKey : e.ctrlKey;

  // --- 撤销操作 Ctrl/Cmd + Z ---
  if (mod && !e.shiftKey && e.key.toLowerCase() === "z") {
    e.preventDefault(); // 阻止浏览器默认撤销行为
    undo(); // 执行自定义撤销函数
    return; // 退出监听
  }

  // --- 重做操作 Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y ---
  if (
    (mod && e.shiftKey && e.key.toLowerCase() === "z") || // Mac 常用 Cmd+Shift+Z
    (mod && e.key.toLowerCase() === "y") // Windows 常用 Ctrl+Y
  ) {
    e.preventDefault(); // 阻止浏览器默认重做行为
    redo(); // 执行自定义重做函数
    return; // 退出监听
  }

  // --- 命令菜单导航 ---
  // 当命令菜单处于激活状态且存在 DOM 元素
  if (cmdMenuState.active && cmdMenuState.element) {
    const opts = cmdMenuState.element.querySelectorAll("button"); // 获取所有菜单选项按钮
    if (!opts.length) return; // 没有选项则返回

    if (e.key === "ArrowDown") {
      e.preventDefault(); // 阻止默认滚动
      // 下移选中索引，循环回到第一项
      cmdMenuState.selectedIndex =
        (cmdMenuState.selectedIndex + 1) % opts.length;
      updateCmdMenuSelection(); // 更新菜单高亮显示
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); // 阻止默认滚动
      // 上移选中索引，循环回到最后一项
      cmdMenuState.selectedIndex =
        (cmdMenuState.selectedIndex - 1 + opts.length) % opts.length;
      updateCmdMenuSelection(); // 更新菜单高亮显示
    } else if (e.key === "Enter") {
      e.preventDefault(); // 阻止默认换行
      // 执行当前选中菜单项的点击事件
      opts[cmdMenuState.selectedIndex].click();
    } else if (e.key === "Escape") {
      e.preventDefault(); // 阻止默认行为
      closeAllMenus(); // 关闭所有菜单
    }
  }

  // --- Shift + Enter 取消当前内容块焦点 ---
  if (e.shiftKey && e.key === "Enter") {
    const active = document.activeElement; // 获取当前聚焦元素
    if (
      active &&
      active.classList && // 确保元素有 classList 属性
      active.classList.contains("content") // 只处理 .content 块
    ) {
      active.blur(); // 移除焦点
      e.preventDefault(); // 阻止默认换行
    }
  }
});

//JIGENG粘贴

editor.addEventListener("paste", async (e) => {
  if (!e.clipboardData) return;
  const items = Array.from(e.clipboardData.items || []);
  const imageItem = items.find((it) => it.type && it.type.startsWith("image/"));
  if (imageItem) {
    e.preventDefault();
    const file = imageItem.getAsFile();
    const dataUrl = await fileToDataURL(file);
    const activeBlock =
      document.activeElement.closest(".block") ||
      document.activeElement.closest("li.block") ||
      null;
    const parent = activeBlock ? activeBlock.parentElement : editor;
    const after = activeBlock ? activeBlock.nextElementSibling : null;
    const imgBlock = createBlock("img", "", { src: dataUrl });
    parent.insertBefore(imgBlock, after);
    saveContent();
  }
});

//JIGENG添加块-菜单(双击)

// 整个容器监听双击事件
editorContainer.addEventListener("dblclick", (e) => {
  const target = e.target;
  // 如果双击的是可编辑块，以及他的父级是可编辑块，按钮，select，a，summary，drag-handle
  // 直接返回
  if (
    target.isContentEditable ||
    target.closest(
      "[contenteditable], button, select, a, summary, .drag-handle"
    )
  )
    return;
  // 阻止浏览器默认行为，阻止冒泡，关闭所有菜单
  e.preventDefault();
  e.stopPropagation();
  closeAllMenus();
  //
  let parent = editor;
  let before = null;
  const closest = target.closest(".block") || target.closest("li.block");
  if (closest) {
    const kids = closest.querySelector(".block-children");
    if (kids && kids.contains(target)) {
      parent = kids;
      before = getDragAfterElement(kids, e.clientY);
    } else if (kids) {
      parent = kids;
      before = null;
    } else {
      parent = closest.parentElement;
      before = closest.nextElementSibling;
    }
  } else {
    parent = editor;
    before = getDragAfterElement(editor, e.clientY);
  }
  createAddMenu(parent, before, false, e);
});
//文档
document.addEventListener("click", (e) => {
  if (!e.target.closest(".add-menu")) {
    closeAllMenus();
  }
});
document.addEventListener("scroll", () => closeAllMenus(), true);

//JIGENG表格(控制按钮事件)

editor.addEventListener("click", (e) => {
  const t = e.target;
  if (
    t.classList.contains("add-row") ||
    t.classList.contains("add-col") ||
    t.classList.contains("del-row") ||
    t.classList.contains("del-col")
  ) {
    const block = t.closest(".block");
    if (!block) return;
    const table = block.querySelector("table");
    if (!table) return;
    if (t.classList.contains("add-row")) {
      const cols = table.querySelector("thead tr").cells.length;
      const row = table.querySelector("tbody").insertRow();
      for (let i = 0; i < cols; i++) {
        const c = row.insertCell();
        c.setAttribute("contenteditable", "true");
        c.textContent = "";
      }
    } else if (t.classList.contains("add-col")) {
      table.querySelectorAll("tr").forEach((r, idx) => {
        const cell =
          r.parentElement.tagName === "THEAD"
            ? document.createElement("th")
            : document.createElement("td");
        cell.setAttribute("contenteditable", "true");
        cell.textContent = "";
        r.appendChild(cell);
      });
    } else if (t.classList.contains("del-row")) {
      const tbody = table.querySelector("tbody");
      if (tbody.rows.length > 1) tbody.deleteRow(-1);
    } else if (t.classList.contains("del-col")) {
      const colCount = table.querySelector("thead tr").cells.length;
      if (colCount > 1)
        table.querySelectorAll("tr").forEach((r) => r.deleteCell(-1));
    }
    saveContent();
  }
});

//JIGENG默认回车添加p段落

let lastKeyWasEnter = false; // 记录上一次是否按下了 Enter
editor.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") {
    lastKeyWasEnter = false; // 其他键就重置
    return;
  }
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const node = sel.anchorNode;
  let contentEl =
    node.nodeType === 3
      ? node.parentElement.closest(".content")
      : node.closest(".content");
  if (!contentEl) return;
  const type = contentEl.dataset.type;

  // --- p / pre / heading / img / blockquote ---------------------------
  if (["p", "pre", "heading", "img", "blockquote"].includes(type)) {
    if (lastKeyWasEnter) {
      // 第二次 Enter → 插入新段落
      e.preventDefault();
      // 把前一个块末尾的换行删除
      contentEl.innerText = contentEl.innerText.replace(/\n$/, "");

      const currentBlock = contentEl.closest(".block");
      const newP = createBlock("p", "");

      currentBlock.parentElement.insertBefore(
        newP,
        currentBlock.nextElementSibling
      );

      newP.querySelector(".content")?.focus();
      saveContent();

      lastKeyWasEnter = false; // 重置
    } else {
      // 第一次 Enter → 只是记录，不插入段落
      lastKeyWasEnter = true;

      // 可选：延时自动清零，避免用户很久以后再按 Enter 还被判定为双 Enter
      setTimeout(() => {
        lastKeyWasEnter = false;
      }, 3000); // 半秒有效窗口
    }
  }
});

//JIGENG列表回车添加

// ✅ 功能总结：
// 只在按下 Enter 且光标在列表项或任务项时触发。
// 空列表项按 Enter → 转为普通段落并删除空列表项，如果列表空则整个列表删除。
// 非空列表项按 Enter → 新增同类型列表项。
// 光标自动跳转到新块或新列表项。
// 保存编辑器状态。

// 给整个编辑器监听按键事件
editor.addEventListener("keydown", (e) => {
  // 不是enter键就结束函数
  if (e.key !== "Enter") return;

  // 光标现在在哪里？选中了哪些文本？没有文本会返回 1（光标位置也算一个 Range）
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const node = sel.anchorNode; // 获取光标所在节点

  // 获取可编辑内容块
  // 如果光标在文本节点 (nodeType === 3)，则取父元素，再向上寻找最近的 .content 元素
  // 否则直接在节点上寻找最近的 .content 元素
  let contentEl =
    node.nodeType === 3
      ? node.parentElement.closest(".content")
      : node.closest(".content");
  if (!contentEl) return; // 如果没有找到 .content 元素，直接返回

  const type = contentEl.dataset.type; // 获取当前内容块的 type，例如 "li" 或 "taskitem"

  // 只处理列表项或任务项
  if (type === "li" || type === "taskitem") {
    e.preventDefault(); // 阻止默认 Enter 行为（换行）

    const currentItem = contentEl.closest("li.block"); // 当前列表项的 li.block
    const listContainer = currentItem.parentElement; // 当前列表的容器（ul 或 ol）

    // 当前列表项有内容，按 Enter 只是分出新列表项
    const newItem = createBlock(type, ""); // 创建相同类型的列表项

    listContainer.insertBefore(
      newItem,
      currentItem.nextElementSibling // 插入到当前列表项后面
    );

    // 光标聚焦到新列表项的内容块中
    newItem.querySelector(".content")?.focus();
    // 如果是有序列表，更新数字
    if (listContainer.tagName.toLowerCase() === "ol") {
      updateOrderedListNumbers(listContainer);
    }
    // 保存编辑器状态（防止数据丢失）
    saveContent();
  }
});

//JIGENG[核心函数] 序列化-将编辑器中的一个块及其子块转换为JSON 对象(不懂??)

function serializeBlock(block) {
  const type = block.dataset.type;
  const data = { type };
  if (type === "li" || type === "taskitem") {
    const contentEl = block.querySelector(".content");
    if (contentEl) data.content = contentEl.innerHTML;
    if (type === "taskitem")
      data.checked = !!block.querySelector(".task-checkbox")?.checked;
    return data;
  }
  const contentEl = block.querySelector(".content");
  if (contentEl) data.content = contentEl.innerHTML;
  if (type === "heading") {
    data.level =
      parseInt(block.querySelector(".content")?.dataset.level, 10) || 2;
  }
  if (type === "pre") {
    data.lang = block.dataset.lang || "javascript";
    data.content = block.querySelector("code")?.textContent || "";
  }
  if (type === "table") {
    data.tableContent = block.querySelector("table")?.innerHTML || "";
  }
  if (type === "img") {
    const img = block.querySelector("img");
    if (img) data.src = img.src;
  }
  const details = block.querySelector(":scope > details");
  if (details) data.openState = details.open;
  const childrenContainer = block.querySelector(
    ":scope > .block-children, :scope > details > .block-children"
  );
  if (childrenContainer && childrenContainer.children.length > 0) {
    data.children = [...childrenContainer.children]
      .filter(
        (c) =>
          c.classList && (c.classList.contains("block") || c.tagName === "LI")
      )
      .map(serializeBlock);
  }
  return data;
}

//JIGENG[核心函数]保存编辑器状态到localStorage

//JIGENG撤销/重做功能

function snapshot(serialized) {
  try {
    const s =
      serialized ||
      JSON.stringify(
        [...editor.children]
          .filter((c) => c.classList.contains("block"))
          .map(serializeBlock)
      );
    if (!s) return;
    if (historyIndex < history.length - 1)
      history = history.slice(0, historyIndex + 1);
    history.push(s);
    if (history.length > HISTORY_LIMIT) history.shift();
    historyIndex = history.length - 1;
  } catch (e) {
    console.warn("snapshot fail", e);
  }
}
function applySnapshot(serialized) {
  try {
    historyLock = true;
    const arr = JSON.parse(serialized);
    editor.innerHTML = "";
    arr.forEach((d) => {
      const b = createBlock(d.type, "", d);
      if (b) editor.appendChild(b);
    });
    editor
      .querySelectorAll("pre code")
      .forEach((c) => Prism.highlightElement(c));
    updateAllHeadingNumbers();
  } catch (e) {
    console.error("apply snapshot fail", e);
  } finally {
    historyLock = false;
  }
}
function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    applySnapshot(history[historyIndex]);
  }
}
function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    applySnapshot(history[historyIndex]);
  }
}

//JIGENG[核心功能]递归更新所有标题的编号(如1.，1.1，1.2.，2.)

function updateAllHeadingNumbers() {
  function walk(container, prefix = "", level = 0) {
    let idx = 1;
    [...container.children]
      .filter((ch) => ch.classList && ch.classList.contains("block"))
      .forEach((child) => {
        if (child.dataset.type === "heading") {
          const num = prefix ? `${prefix}.${idx}` : `${idx}`;
          const span = child.querySelector(".heading-number");
          if (span) span.textContent = num + ". ";
          const contentEl = child.querySelector(".content");
          if (contentEl) {
            const wantTag = `h${Math.min(6, level + 1)}`;
            if (contentEl.tagName.toLowerCase() !== wantTag) {
              const newH = document.createElement(wantTag);
              newH.className = "content";
              newH.setAttribute("contenteditable", "true");
              newH.innerHTML = contentEl.innerHTML;
              newH.dataset.type = "heading";
              newH.dataset.level = level + 1;
              contentEl.replaceWith(newH);
              newH.addEventListener(
                "input",
                debounce(() => saveContent(), 400)
              );
            } else {
              contentEl.dataset.level = level + 1;
            }
          }
          const kids = child.querySelector(".block-children");
          if (kids) walk(kids, num, level + 1);
          idx++;
        }
      });
  }
  walk(editor);
  updateToc();
}

//JIGENG[核心功能]解析 Markdown 文本并插入到编辑器

function parseAndInsertMarkdown(
  mdText,
  targetContainer = editor,
  beforeEl = null
) {
  const md = window.markdownit
    ? window.markdownit({
        html: true,
        linkify: true,
        typographer: true,
      })
    : null;
  if (!md) {
    console.error("markdown-it library not found!");
    return;
  }
  const html = md.render(mdText);
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const parentStack = [{ container: targetContainer, level: 0 }];
  Array.from(tmp.childNodes).forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const name = node.nodeName.toLowerCase();
    let newBlock = null;
    if (name.match(/^h([1-6])$/)) {
      const level = parseInt(RegExp.$1, 10);
      newBlock = createBlock("heading", "", {
        level,
        content: node.innerHTML,
        openState: true,
      });
      while (
        parentStack.length > 1 &&
        parentStack[parentStack.length - 1].level >= level
      ) {
        parentStack.pop();
      }
      const currentParent = parentStack[parentStack.length - 1].container;
      currentParent.appendChild(newBlock);
      parentStack.push({
        container: newBlock.querySelector(".block-children"),
        level: level,
      });
    } else {
      if (name === "p")
        newBlock = createBlock("p", "", { content: node.innerHTML });
      else if (name === "pre") {
        const code = node.querySelector("code");
        const lang =
          code && code.className.match(/language-(\S+)/)
            ? RegExp.$1
            : "plaintext";
        newBlock = createBlock("pre", "", {
          content: code ? code.textContent : node.textContent,
          lang,
        });
      } else if (name === "ul") {
        const lis = Array.from(node.querySelectorAll(":scope > li"));
        const isTask = lis.some((li) =>
          /^\s*\[[ xX]\]\s*/.test(li.textContent)
        );
        if (isTask) {
          newBlock = createBlock("task");
          const cont = newBlock.querySelector(".block-children");
          lis.forEach((li) => {
            const text = li.innerHTML
              .replace(/^\s*<input[^>]*>\s*/, "")
              .replace(/^\s*\[[ xX]\]\s*/, "");
            const checked =
              /^\s*\[[xX]\]/.test(li.innerHTML) ||
              (li.firstChild && li.firstChild.checked);
            cont.appendChild(
              createBlock("taskitem", "", { content: text, checked })
            );
          });
        } else {
          newBlock = createBlock("ul");
          const cont = newBlock.querySelector(".block-children");
          lis.forEach((li) =>
            cont.appendChild(createBlock("li", "", { content: li.innerHTML }))
          );
        }
      } else if (name === "ol") {
        newBlock = createBlock("ol");
        const cont = newBlock.querySelector(".block-children");
        node
          .querySelectorAll(":scope > li")
          .forEach((li) =>
            cont.appendChild(createBlock("li", "", { content: li.innerHTML }))
          );
      } else if (name === "blockquote")
        newBlock = createBlock("blockquote", "", {
          content: node.innerHTML,
        });
      else if (name === "table")
        newBlock = createBlock("table", "", {
          tableContent: node.innerHTML,
        });
      else if (name === "img")
        newBlock = createBlock("img", "", {
          src: node.getAttribute("src"),
        });
      else newBlock = createBlock("p", "", { content: node.outerHTML });
      if (newBlock) {
        const currentParent = parentStack[parentStack.length - 1].container;
        currentParent.appendChild(newBlock);
      }
    }
  });
  updateAllHeadingNumbers();
  saveContent();
}

//JIGENG[核心功能]导出编辑器内容为 Markdown 文件

function exportToMarkdown() {
  if (typeof TurndownService === "undefined") {
    console.error("Turndown library not found!");
    return;
  }
  const turndownService = new TurndownService({ headingStyle: "atx" });
  turndownService.addRule("taskListItem", {
    filter: function (node, options) {
      return (
        node.nodeName === "LI" &&
        node.classList.contains("block") &&
        node.dataset.type === "taskitem"
      );
    },
    replacement: function (content, node) {
      const checkbox = node.querySelector(".task-checkbox");
      const checked = checkbox && checkbox.checked ? "[x]" : "[ ]";
      const contentDiv = node.querySelector(".content");
      const innerContent = turndownService.turndown(contentDiv || "");
      return `- ${checked} ${innerContent}`;
    },
  });
  turndownService.addRule("taskListContainer", {
    filter: function (node) {
      return node.nodeName === "DIV" && node.dataset.type === "task";
    },
    replacement: function (content) {
      return content;
    },
  });
  const clone = editor.cloneNode(true);
  clone
    .querySelectorAll(
      ".drag-handle, .delete-btn, .code-toolbar, .heading-number, .task-checkbox"
    )
    .forEach((n) => n.remove());
  const md = turndownService.turndown(clone);
  const MdFILE_NAME = FILE_NAME.replace(/\.[^/.]+$/, "") + ".md";
  downloadFile(MdFILE_NAME, md, "text/markdown");
}

//JIGENGFAB（悬浮操作按钮）相关功能

const mdInput = document.createElement("input");
mdInput.type = "file";
mdInput.accept = ".md,.markdown,.txt";
mdInput.style.display = "none";
mdInput.addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const txt = await f.text();
  parseAndInsertMarkdown(txt, editor, null);
  e.target.value = "";
});
document.body.appendChild(mdInput);

//清空editor的内容
function clearAll() {
  const editor = document.getElementById("editor");
  if (editor) {
    editor.innerHTML = "";
  }
}
//折叠所有标题
function FoldHeading() {
  document.querySelectorAll("details").forEach((detail) => {
    if (detail.hasAttribute("open")) {
      detail.removeAttribute("open");
    }
  });
}

function exportToPDF() {
  if (typeof html2pdf === "undefined") {
    console.error("html2pdf library not found!");
    return;
  }
  const node = editor.cloneNode(true);
  node.style.padding = "20px";
  node
    .querySelectorAll(
      ".drag-handle, .delete-btn, .code-toolbar, .table-controls"
    )
    .forEach((n) => n.remove());
  const opt = {
    margin: 10,
    filename: "document.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(node).save();
}
const fabMain = document.getElementById("fab-main");
const fabMenu = document.getElementById("fab-menu");
fabMain.addEventListener("click", (e) => {
  e.stopPropagation();
  fabMenu.style.display = fabMenu.style.display === "flex" ? "none" : "flex";
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#fab")) fabMenu.style.display = "none";
});
document.getElementById("fab-import").addEventListener("click", () => {
  mdInput.click();
  fabMenu.style.display = "none";
});
document.getElementById("fab-export-md").addEventListener("click", () => {
  exportToMarkdown();
  fabMenu.style.display = "none";
});
document.getElementById("fab-export-pdf").addEventListener("click", () => {
  exportToPDF();
  fabMenu.style.display = "none";
});
document.getElementById("fab-fold").addEventListener("click", () => {
  FoldHeading();
  fabMenu.style.display = "none";
});
document.getElementById("fab-clean-all").addEventListener("click", () => {
  clearAll();
  fabMenu.style.display = "none";
});
document.getElementById("fab-clear").addEventListener("click", () => {
  if (confirm("确认清空本地保存？")) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.location.reload();
  }
  fabMenu.style.display = "none";
});

//JIGENGTOC （目录)相关功能

const tocList = document.getElementById("toc-list");
const tocFab = document.getElementById("toc-fab");
const tocPanel = document.getElementById("toc-panel");
let tocHideTimeout = null;

tocFab.addEventListener("mouseenter", () => {
  clearTimeout(tocHideTimeout);
  tocPanel.classList.add("is-visible");
});

tocFab.addEventListener("mouseleave", () => {
  tocHideTimeout = setTimeout(() => {
    tocPanel.classList.remove("is-visible");
  }, 300);
});

function updateToc() {
  tocList.innerHTML = "";
  const headings = editor.querySelectorAll('.block[data-type="heading"]');
  if (headings.length === 0) {
    tocList.innerHTML =
      '<li><a href="#" style="color:#999; pointer-events:none;">暂无标题</a></li>';
    return;
  }
  headings.forEach((headingBlock, index) => {
    const contentEl = headingBlock.querySelector(".content");
    const numberSpan = headingBlock.querySelector(".heading-number");
    if (!contentEl || !numberSpan) return;

    const id = headingBlock.id || `heading-${index}-${Date.now()}`;
    headingBlock.id = id;

    const level = (numberSpan.textContent.match(/\./g) || []).length + 1;

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = `${numberSpan.textContent} ${contentEl.textContent}`;
    a.className = `toc-level-${level}`;
    li.appendChild(a);
    tocList.appendChild(li);
  });
}

document.getElementById("toc-panel").addEventListener("click", (e) => {
  if (e.target.tagName === "A" && e.target.hash) {
    e.preventDefault();
    const targetId = e.target.hash.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      let parent = targetElement.parentElement;
      while (parent) {
        if (parent.tagName === "DETAILS" && !parent.open) {
          parent.open = true;
        }
        parent = parent.parentElement;
      }
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
});
