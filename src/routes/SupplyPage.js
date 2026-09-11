import { bindStatusBox, renderStatusBox } from "../components/StatusBox";
import "../styles/SupplyPage.css";

const vehicleLabels = { car: "Automóvil", motorbike: "Motocicleta", truck: "Camión" };

export function renderTankWaves() {
  return /*html*/ `
    <div class="tank-waves" aria-hidden="true"><span></span><span></span></div>
  `;
}

export default function renderSupplyPage(inventoryService, container) {
  const tank = inventoryService.getTank();
  const currentQuantity = tank.getQuantity();
  const assignedValues = inventoryService.getAssignedLtPerVehicle();
  const distributionFields = Object.entries(assignedValues)
    .map(([type, value]) => /*html*/ `
      <label class="supply-distribution-field">
        <span>${vehicleLabels[type] ?? type}</span>
        <span class="input-with-unit">
          <input name="${type}" type="number" min="1" step="1" value="${value}" required>
          <span>lt</span>
        </span>
      </label>
    `).join("");

  container.innerHTML = /*html*/ `
    <main class="operation-page supply-page">
      <section class="operation-card" aria-labelledby="supply-title">
        <header class="operation-header">
          <p class="operation-eyebrow">Inventario</p>
          <h1 id="supply-title">Surtir estación</h1>
        </header>
        <form data-supply-form>
          <div class="station-tank">
            ${renderTankWaves()}
            <div class="station-tank-content">
              <label for="tank-quantity">Tanque de la Estación</label>
              <span class="input-with-unit input-with-unit--large">
                <input id="tank-quantity" name="tankQuantity" type="number" min="1" step="1" value="${currentQuantity}" required>
                <span>lt</span>
              </span>
            </div>
          </div>
          <section class="supply-distribution" aria-labelledby="distribution-title">
            <h2 id="distribution-title">Litros asignados por vehículo</h2>
            <div class="supply-distribution-grid">${distributionFields}</div>
          </section>
          ${renderStatusBox()}
          <a class="button" href="/dashboard" data-link>Volver al panel</a>
          <button class="button button--primary" type="submit">Guardar configuración</button>
        </form>
      </section>
    </main>
  `;

  const form = container.querySelector("[data-supply-form]");
  const statusBox = bindStatusBox(container);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const values = Object.fromEntries(new FormData(form));
      const assignedLtPerVehicleType = {
        car: Number(values.car),
        motorbike: Number(values.motorbike),
        truck: Number(values.truck),
      };

      inventoryService.setAssignedLtPerVehicle(assignedLtPerVehicleType);
      tank.supply(Number(values.tankQuantity));
      statusBox.show("La configuración fue guardada correctamente.", "success");
    } catch (error) {
      statusBox.show(error.message);
    }
  });
}
