import * as lottie from "lottie-web";
import Waves from "../assets/Waves.json";
import { bindStatusBox, renderStatusBox } from "../components/StatusBox";
import "../styles/SupplyPage.css";

const vehicleLabels = {
  car: "Automóvil",
  motorbike: "Motocicleta",
  truck: "Camión",
};

export default function renderSupplyPage(
  inventoryService,
  ticketService,
  container
) {
  const tank = inventoryService.getTank();
  const currentQuantity = tank.getQuantity();
  const assignedValues = inventoryService.getAssignedLtPerVehicle();
  const supplySchedule = ticketService.getSupplySchedule();
  const distributionFields = Object.entries(assignedValues)
    .map(
      ([type, value]) => /*html*/ `
      <label class="form-field">
        <span>${vehicleLabels[type] ?? type}</span>
        <span class="input-with-unit">
          <input name="${type}" type="number" min="1" step="1" value="${value}" required>
          <span>lt</span>
        </span>
      </label>
    `
    )
    .join("");

  container.innerHTML = /*html*/ `
    <main class="operation-page supply-page">
      <section class="operation-card" aria-labelledby="supply-title">
        <header class="operation-header">
          <a class="button button--icon" href="/dashboard" aria-label="Volver al panel" data-link><i class="fa-solid fa-angle-left"></i></a>
          <h1 id="supply-title">Surtir estación</h1>
        </header>
        <form data-supply-form>
          
          <div class="station-tank">
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
          <section class="supply-schedule" aria-labelledby="schedule-title">
            <h2 id="schedule-title">Horario de suministro</h2>
            <p>Las asignaciones solo estarán disponibles durante este intervalo.</p>
            <div class="supply-schedule-grid">
              <label class="form-field" for="supply-start">
                Hora de inicio
                <input id="supply-start" name="supplyStart" type="time" value="${supplySchedule.start ?? ""}" required>
              </label>
              <label class="form-field" for="supply-end">
                Hora de fin
                <input id="supply-end" name="supplyEnd" type="time" value="${supplySchedule.end ?? ""}" required>
              </label>
            </div>
          </section>
          ${renderStatusBox()}
          <button class="button button--primary" type="submit">Guardar configuración</button>
        </form>
      </section>
    </main>
  `;

  const form = container.querySelector("[data-supply-form]");
  const stationTankContainer = container.querySelector(".station-tank");
  const statusBox = bindStatusBox(container);

  const anim = lottie.loadAnimation({
    container: stationTankContainer,
    renderer: "svg",
    loop: true,
    autoplay: true,
    animationData: Waves,
  });

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
      ticketService.setSupplySchedule({
        start: values.supplyStart,
        end: values.supplyEnd,
      });
      statusBox.show("La configuración fue guardada correctamente.", "success");
    } catch (error) {
      statusBox.show(error.message);
    }
  });
}
