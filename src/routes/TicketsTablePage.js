import { bindStatusBox, renderStatusBox } from "../components/StatusBox";
import "../styles/TicketsTablePage.css";

const vehicleLabels = {
  Car: "Automóvil",
  Motorbike: "Motocicleta",
  Truck: "Camión",
};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTicketRow(ticket, container) {
  const accepted = ticket.status?.success === true;
  container.insertAdjacentHTML(
    "beforeend",
    /*html*/ `
      <tr>
        <td>${escapeHTML(ticket.emissionDate)}</td>
        <td>${escapeHTML(ticket.id)}</td>
        <td>${escapeHTML(ticket.verificationCode)}</td>
        <td>${escapeHTML(vehicleLabels[ticket.vehicle?.type] ?? ticket.vehicle?.type)}</td>
        <td>${escapeHTML(ticket.vehicle?.brand)}</td>
        <td>${escapeHTML(ticket.vehicle?.model)}</td>
        <td>${escapeHTML(ticket.vehicle?.plateNumber)}</td>
        <td>${escapeHTML(ticket.vehicle?.colour)}</td>
        <td><span class="ticket-state ticket-state--${accepted ? "accepted" : "cancelled"}">${accepted ? "Aceptado" : "Cancelado"}</span></td>
        <td>${accepted ? "—" : escapeHTML(ticket.status?.message ?? "Sin motivo registrado")}</td>
        <td><button class="button" type="button" data-ticket data-verification-code="${escapeHTML(ticket.verificationCode)}">Ver comprobante</button></td>
        <td>${accepted ? `${escapeHTML(ticket.status?.quantity ?? 0)} lt` : "—"}</td>
</tr>
    `
  );
}

function renderTable(tickets, container, assignedTotal) {
  container.innerHTML = /*html*/ `
    <div class="tickets-table-wrap">
      <table class="tickets-table">
        <thead>
          <tr>
            <th>Fecha de emisión</th><th>Turno</th><th>Código</th><th>Tipo de vehículo</th>
            <th>Marca</th><th>Modelo</th><th>Placa</th><th>Color</th><th>Estatus</th><th>Motivo de cancelación</th><th>Comprobante</th><th>Combustible</th>
          </tr>
        </thead>
        <tbody data-ticket-rows></tbody>
        <tfoot><tr><th colspan="11">Total de combustible asignado</th><td>${escapeHTML(assignedTotal)} lt</td><td colspan="2"></td></tr></tfoot>
      </table>
    </div>
  `;

  const rows = container.querySelector("[data-ticket-rows]");
  if (tickets.length === 0) {
    rows.innerHTML =
      '<tr><td class="tickets-empty" colspan="13">No se encontraron tickets con estos filtros.</td></tr>';
    return;
  }
  tickets.forEach((ticket) => renderTicketRow(ticket, rows));
}

function getFilters(form) {
  const values = Object.fromEntries(new FormData(form));
  const filters = {};
  ["verificationCode", "plateNumber", "model", "brand", "type"].forEach(
    (key) => {
      const value = values[key]?.trim();
      if (value) filters[key] = value;
    }
  );
  if (values.ticketStatus) {
    filters.status = { success: values.ticketStatus === "accepted" };
  }
  return filters;
}

export default function renderTicketsTablePage(
  ticketService,
  container,
  onTicketClick
) {
  container.innerHTML = /*html*/ `
    <main class="tickets-table-page">
      <section class="tickets-card" aria-labelledby="tickets-title">
        <header class="tickets-header">
          <div>
            <p class="tickets-eyebrow">Historial</p>
            <h1 id="tickets-title">Tickets</h1>
            <p>Consulta los reportes emitidos por la estación.</p>
          </div>
          <a class="button" href="/dashboard" data-link>Volver al panel</a>
        </header>

        <form class="ticket-filters" data-filters>
          <div class="form-field"><label for="filter-code">Código de verificación</label><input id="filter-code" name="verificationCode" type="text" inputmode="numeric" pattern="[0-9]{3}" maxlength="3"></div>
          <div class="form-field"><label for="filter-plate">Placa</label><input id="filter-plate" name="plateNumber" type="text"></div>
          <div class="form-field"><label for="filter-model">Modelo</label><input id="filter-model" name="model" type="text"></div>
          <div class="form-field"><label for="filter-brand">Marca</label><input id="filter-brand" name="brand" type="text"></div>
          <div class="form-field">
            <label for="filter-type">Tipo de vehículo</label>
            <select id="filter-type" name="type"><option value="">Todos</option><option value="Car">Automóvil</option><option value="Motorbike">Motocicleta</option><option value="Truck">Camión</option></select>
          </div>
          <div class="form-field">
            <label for="filter-status">Estatus</label>
            <select id="filter-status" name="ticketStatus"><option value="">Todos</option><option value="accepted">Aceptado</option><option value="cancelled">Cancelado</option></select>
          </div>
          <div class="ticket-filter-actions">
            <button class="button button--primary" type="submit">Filtrar</button>
            <button class="button" type="reset">Limpiar</button>
          </div>
        </form>

        ${renderStatusBox()}
        <section data-table aria-live="polite"></section>
      </section>
    </main>
  `;

  const page = container.querySelector(".tickets-table-page");
  const filters = page.querySelector("[data-filters]");
  const tableSection = page.querySelector("[data-table]");
  const statusBox = bindStatusBox(page);

  const renderTickets = () => {
    try {
      const tickets = ticketService.getTickets(getFilters(filters));
      const assignedTotal = tickets.reduce(
        (total, ticket) =>
          total +
          (ticket.status?.success ? Number(ticket.status.quantity) || 0 : 0),
        0
      );
      renderTable(tickets, tableSection, assignedTotal);
      statusBox.hide();
    } catch (error) {
      statusBox.show(error.message);
    }
  };

  filters.addEventListener("submit", (event) => {
    event.preventDefault();
    renderTickets();
  });
  filters.addEventListener("reset", () => window.setTimeout(renderTickets));
  tableSection.addEventListener("click", (event) => {
    const ticketButton = event.target.closest("button[data-ticket]");
    if (ticketButton) onTicketClick(ticketButton.dataset.verificationCode);
  });

  renderTickets();
}
