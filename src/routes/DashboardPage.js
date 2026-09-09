import "../styles/DashboardPage.css";

const dashboardActions = [
  { href: "/asignar", title: "Asignar", description: "Registrar datos del vehículo", roles: [null, "employee", "admin"] },
  { href: "/surtir", title: "Surtir", description: "Surtir estación y configurar esquema de distribución", roles: ["employee", "admin"] },
  { href: "/tickets", title: "Tickets", description: "Consultar historial de reportes", roles: ["employee", "admin"] },
  { href: "/usuarios", title: "Usuarios", description: "Manejo de usuarios", roles: ["admin"] },
];

export default function renderDashboardPage(user, container) {
  const userLevel = user?.role ?? null;
  const actions = dashboardActions
    .filter(({ roles }) => roles.includes(userLevel))
    .map(
      ({ href, title, description }) => /*html*/ `
        <a class="dashboard-action" href="${href}" data-link>
          <span class="dashboard-action-title">${title}</span>
          <span>${description}</span>
          <span class="dashboard-action-arrow" aria-hidden="true">→</span>
        </a>
      `
    )
    .join("");

  container.innerHTML = /*html*/ `
    <main class="dashboard-page">
      <section class="dashboard-card">
        <p class="dashboard-eyebrow">Sistema Orichuna</p>
        <h1>Panel principal</h1>
        <nav class="dashboard-actions" aria-label="Opciones del sistema">${actions}</nav>
        <div class="dashboard-session">
          <span data-user-details></span>
          ${user ? `<button class="button" type="button">Cerrar sesión</button>` : `<a class="button button--primary" href="/" data-link>Iniciar sesión</a>`}
        </div>
      </section>
    </main>
  `;

  container.querySelector("[data-user-details]").textContent = user
    ? `Sesión iniciada como ${user.email} (${user.role}).`
    : "Has continuado como cliente.";
}
