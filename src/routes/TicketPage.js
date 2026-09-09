import { renderAsync } from "docx-preview";
import { bindStatusBox, renderStatusBox } from "../components/StatusBox";
import "../styles/TicketPage.css";

export default async function renderTicketPage(ticketService, reportService, container, verificationCode) {
  container.innerHTML = /*html*/ `
    <main class="ticket-page">
      <section class="ticket-card" aria-labelledby="ticket-title">
        <header class="operation-header">
          <p class="operation-eyebrow">Comprobante</p>
          <h1 id="ticket-title">Ticket de combustible</h1>
        </header>
        ${renderStatusBox()}
        <div class="ticket-preview" data-ticket-preview aria-busy="true"></div>
        <div class="ticket-actions">
          <a class="button" href="/dashboard" data-link>Volver al panel</a>
          <a class="button button--primary" data-ticket-download hidden>Descargar DOCX</a>
        </div>
      </section>
    </main>
  `;

  const statusBox = bindStatusBox(container);
  const preview = container.querySelector("[data-ticket-preview]");
  const download = container.querySelector("[data-ticket-download]");

  try {
    if (!verificationCode) throw new Error("No se proporcionó un código de verificación.");

    const [ticket] = ticketService.getTickets({ verificationCode });
    if (!ticket) throw new Error("No se encontró un ticket con ese código.");

    const blob = await reportService.generateTicketReport(ticket);
    await renderAsync(blob, preview, undefined, {
      className: "ticket-document",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
    });

    preview.setAttribute("aria-busy", "false");
    download.href = URL.createObjectURL(blob);
    download.download = `ticket-${verificationCode}.docx`;
    download.hidden = false;
  } catch (error) {
    preview.setAttribute("aria-busy", "false");
    statusBox.show(error.message);
  }
}
