import "../styles/DashboardPage.css";

const dashboardActions = [
  { href: "/asignar", title: "Asignar", description: "Registrar datos del vehículo", roles: [null, "employee", "admin"], color: "#3b82f6" },
  { href: "/surtir", title: "Surtir", description: "Surtir estación y configurar la distribución", roles: ["employee", "admin"], color: "#ef4444" },
  { href: "/tickets", title: "Tickets", description: "Consultar historial de reportes", roles: ["employee", "admin"], color: "#84cc16" },
  { href: "/usuarios", title: "Usuarios", description: "Manejo de usuarios", roles: ["admin"], color: "#f59e0b" },
];

export default function renderDashboardPage(user, container, onLogout) {
  const userLevel = user?.role ?? null;
  const actions = dashboardActions
    .filter(({ roles }) => roles.includes(userLevel))
    .map(
      ({ href, title, description, color }) => /*html*/ `
        <a class="dashboard-action" href="${href}" data-link style="background-color: ${color}; border-color: ${color};">
          <span class="dashboard-action-title">${title}</span>
          <span>${description}</span>
          <span class="dashboard-action-arrow" aria-hidden="true"><i class="fa-solid fa-right-to-bracket fa-lg" style="color: #fff"></i></span>
        </a>
      `
    )
    .join("");

  container.innerHTML = /*html*/ `
    <main class="dashboard-page">
      <section class="dashboard-card">
        <h1>Panel de control</h1>
        <nav class="dashboard-actions" aria-label="Opciones del sistema">${actions}</nav>
        <div class="dashboard-session">
          <span data-user-details></span>
          ${user ? `<button class="button" type="button" data-logout>Cerrar sesión</button>` : `<a class="button button--primary" href="/" data-link>Iniciar sesión</a>`}
        </div>
      </section>
    </main>
  `;

  container.querySelector("[data-user-details]").textContent = user
    ? `Sesión iniciada como ${user.email} (${user.role}).`
    : "Has continuado como cliente.";

  container.querySelector("[data-logout]")?.addEventListener("click", () => {
    globalThis.location.href = "/";
    onLogout()
  })
}
