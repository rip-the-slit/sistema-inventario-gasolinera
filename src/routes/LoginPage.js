import "../styles/LoginPage.css";
import { bindStatusBox, renderStatusBox } from "../components/StatusBox";

export default function renderLoginPage(authService, container, onLogin) {
  container.innerHTML = /*html*/ `
    <main class="login-page">
      <section class="login-card" aria-labelledby="login-title">

        <header class="login-header">
          <h1 id="login-title">Iniciar sesión</h1>
          <p>Ingresa tus credenciales para acceder al panel.</p>
        </header>

        <div class="login-navigation" aria-label="Navegación de acceso">
          <a class="button" href="/dashboard" data-link>Continuar como cliente</a>
        </div>

        <form data-login-form>
          <div class="form-field">
            <label id="login-id-label" for="login-id-number">Cédula de identidad</label>
            <div class="cedula-input">
              <select name="idPrefix" aria-label="Nacionalidad" required>
                <option value="V-">V-</option>
                <option value="E-">E-</option>
              </select>
              <input id="login-id-number" name="idNumber" type="number" inputmode="numeric" autocomplete="username" aria-labelledby="login-id-label" min="1" max="100000000" step="1" placeholder="12345678" required>
            </div>
          </div>

          <div class="form-field">
            <label for="login-email">Correo electrónico</label>
            <input id="login-email" name="email" type="email" autocomplete="email" placeholder="tu@correo.electronico" maxlength="20" required>
          </div>

          <div class="form-field">
            <label for="login-password">Contraseña</label>
            <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="●●●●●●●●" maxlength="20" required>
          </div>

          ${renderStatusBox()}

          <button class="button button--primary login-submit" type="submit">Iniciar sesión</button>
        </form>
      </section>
    </main>
  `;

  const form = container.querySelector("[data-login-form]");
  const statusBox = bindStatusBox(container);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const credentials = Object.fromEntries(new FormData(form));
    credentials.id = `${credentials.idPrefix}${credentials.idNumber}`;
    delete credentials.idPrefix;
    delete credentials.idNumber;

    try {
      const user = authService.login(credentials);
      onLogin(user);
    } catch (error) {
      statusBox.show(error.message);
    }
  });

}
