editor.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const node = sel.anchorNode;

  let contentEl =
    node.nodeType === 3
      ? node.parentElement.closest(".content")
      : node.closest(".content");
  if (!contentEl) return;

  const type = contentEl.dataset.type;
  if (type !== "li" && type !== "taskitem") return;

  e.preventDefault();

  const currentItem = contentEl.closest("li.block");
  const listContainer = currentItem.parentElement;

  // 创建新列表项
  const newItem = createBlock(type, "", { parentContainer: listContainer });
  listContainer.insertBefore(newItem, currentItem.nextElementSibling);

  // 焦点聚焦到新项
  newItem.querySelector(".content")?.focus();

  // 如果是有序列表，更新数字
  if (listContainer.tagName.toLowerCase() === "ol") {
    updateOrderedListNumbers(listContainer);
  }

  saveContent();
});
