import { bindStatusBox, renderStatusBox } from "../components/StatusBox";
import "../styles/AssignPage.css";

const ASSIGNMENT_TIMEOUT_MS = 3 * 60 * 1000;

function toMinutes(time) {
  const match = /^(\d{2}):(\d{2})$/.exec(time ?? "");
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function isWithinSupplySchedule(schedule, now = new Date()) {
  const start = toMinutes(schedule?.start);
  const end = toMinutes(schedule?.end);
  if (start === null || end === null || start === end) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  return start < end
    ? current >= start && current <= end
    : current >= start || current <= end;
}

export default function renderAssignPage(ticketService, isSupplied, user, container, onTicket) {
  const supplySchedule = ticketService.getSupplySchedule();
  const isWithinSchedule = isWithinSupplySchedule(supplySchedule);

  if (!isSupplied || !isWithinSchedule) {
    const unavailableMessage = !isSupplied
      ? "La estación no dispone del nivel mínimo de combustible."
      : "La estación se encuentra fuera del horario de suministro configurado.";

    container.innerHTML = /*html*/ `
      <main class="operation-page">
        <section class="operation-card operation-card--message">
          <h1>No es posible asignar en estos momentos</h1>
          <p>${unavailableMessage}</p>
          ${user?.role === "admin" && !isSupplied ? `<a class="button button--primary" href="/surtir" data-link>Surta la estación antes de asignar</a>` : ""}
          ${user?.role === "admin" && isSupplied && !isWithinSchedule ? `<a class="button button--primary" href="/surtir" data-link>Ajustar horario de suministro</a>` : ""}
          <a class="button" href="/dashboard" data-link>Volver al panel</a>
        </section>
      </main>
    `;
    return;
  }

  container.innerHTML = /*html*/ `
    <main class="operation-page">
      <section class="operation-card" aria-labelledby="assign-title">
        <header class="operation-header">
          <a class="button button--icon" href="/dashboard" aria-label="Volver al panel" data-link><i class="fa-solid fa-angle-left"></i></a>
          <h1 id="assign-title">Registrar vehículo</h1>
        </header>

        <p>Complete la operación durante los próximos tres minutos.</p>
        <form class="vehicle-form" data-assign-form>
          <div class="form-field">
            <label for="vehicle-type">Tipo de vehículo</label>
            <select id="vehicle-type" name="vehicleType" required>
              <option value="car">Automóvil</option>
              <option value="motorbike">Motocicleta</option>
              <option value="truck">Camión</option>
            </select>
          </div>
          <div class="form-field"><label for="vehicle-brand">Marca</label><input id="vehicle-brand" name="brand" type="text" placeholder="Toyota" minLength="2" maxLength="20" required></div>
          <div class="form-field"><label for="vehicle-model">Modelo</label><input id="vehicle-model" name="model" type="text" placeholder="RAV4" minLength="2" maxLength="20" required></div>
          <div class="form-field"><label for="vehicle-plate">Placa</label><input id="vehicle-plate" name="plateNumber" type="text" placeholder="AB123CD" pattern="^[A-Z]{2}[0-9]{3}[A-Z]{2}$" oninvalid="this.setCustomValidity('Tu placa debe tener el siguiente formato: {Let}{Let}{Num}{Num}{Num}{Let}{Let} en mayúsculas.')" oninput="this.setCustomValidity('')" required></div>
          <div class="form-field">
            <label for="vehicle-colour">Color</label>
            <select id="vehicle-colour" name="colour" required>
              <option value="000000">Negro</option>
              <option value="FFFFFF">Blanco</option>
              <option value="FF0000">Rojo</option>
              <option value="0000FF">Azul</option>
              <option value="008000">Verde</option>
              <option value="FFFF00">Amarillo</option>
              <option value="FFA500">Naranja</option>
              <option value="800080">Morado</option>
              <option value="FFC0CB">Rosa</option>
              <option value="808080">Gris</option>
            </select>
          </div>
          ${renderStatusBox()}
          <button class="button button--primary" type="submit">Generar ticket</button>
        </form>
      </section>
    </main>
  `;

  const form = container.querySelector("[data-assign-form]");
  const statusBox = bindStatusBox(container);
  let completed = false;
  let timeoutId;

  const submitTicket = (status) => {
    if (completed) return;

    if (!isWithinSupplySchedule(ticketService.getSupplySchedule())) {
      statusBox.show("La estación se encuentra fuera del horario de suministro configurado.");
      return;
    }

    try {
      const vehicleData = Object.fromEntries(new FormData(form));
      const ticket = ticketService.generateTicket({ ...vehicleData, status });
      if (!ticket?.verificationCode) throw new Error("No fue posible generar el ticket.");

      completed = true;
      window.clearTimeout(timeoutId);
      onTicket(ticket.verificationCode);
    } catch (error) {
      statusBox.show(error.message);
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitTicket({ success: true });
  });

  timeoutId = window.setTimeout(() => {
    if (document.body.contains(form)) {
      submitTicket({ success: false, message: "Se agotó el tiempo para realizar la operación" });
    }
  }, ASSIGNMENT_TIMEOUT_MS);
}
