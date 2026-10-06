export function renderText(selector, content) {
  const element = document.querySelector(selector);

  if (!element) {
    return;
  }

  element.textContent = content;
}
