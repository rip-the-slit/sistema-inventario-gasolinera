import "../styles/StatusBox.css";

export function renderStatusBox() {
  return /*html*/ `
    <div class="status-box" data-status-box role="alert" aria-live="polite">
      <span data-status-message></span>
      <button class="button button--icon" type="button" data-close-status aria-label="Cerrar mensaje">×</button>
    </div>
  `;
}

export function bindStatusBox(container) {
  const element = container.querySelector("[data-status-box]");
  const message = element.querySelector("[data-status-message]");
  const closeButton = element.querySelector("[data-close-status]");

  const hide = () => {
    element.classList.remove("open");
    element.removeAttribute("data-tone");
    message.textContent = "";
  };

  const show = (text, tone = "error") => {
    message.textContent = text;
    element.dataset.tone = tone;
    element.classList.add("open");
  };

  closeButton.addEventListener("click", hide);
  return { show, hide };
}
