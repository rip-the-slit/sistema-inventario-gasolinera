import { bindStatusBox, renderStatusBox } from "../components/StatusBox";
import "../styles/AssignPage.css";

const ASSIGNMENT_TIMEOUT_MS = 3 * 60 * 1000;

export default function renderAssignPage(ticketService, isSupplied, user, container, onTicket) {
  if (!isSupplied) {
    container.innerHTML = /*html*/ `
      <main class="operation-page">
        <section class="operation-card operation-card--message">
          <h1>No es posible asignar en estos momentos</h1>
          <p>La estación no dispone del nivel mínimo de combustible.</p>
          ${user?.role === "admin" ? `<a class="button button--primary" href="/surtir" data-link>Surta la estación antes de asignar</a>` : ""}
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
          <p class="operation-eyebrow">Asignación de combustible</p>
          <h1 id="assign-title">Registrar vehículo</h1>
          <p>Complete la operación durante los próximos tres minutos.</p>
        </header>

        <form class="vehicle-form" data-assign-form>
          <div class="form-field">
            <label for="vehicle-type">Tipo de vehículo</label>
            <select id="vehicle-type" name="vehicleType" required>
              <option value="car">Automóvil</option>
              <option value="motorbike">Motocicleta</option>
              <option value="truck">Camión</option>
            </select>
          </div>
          <div class="form-field"><label for="vehicle-brand">Marca</label><input id="vehicle-brand" name="brand" type="text" required></div>
          <div class="form-field"><label for="vehicle-model">Modelo</label><input id="vehicle-model" name="model" type="text" required></div>
          <div class="form-field"><label for="vehicle-plate">Placa</label><input id="vehicle-plate" name="plateNumber" type="text" required></div>
          <div class="form-field"><label for="vehicle-colour">Color</label><input id="vehicle-colour" name="colour" type="text" required></div>
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
