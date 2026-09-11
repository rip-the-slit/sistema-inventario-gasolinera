import { bindStatusBox, renderStatusBox } from "../components/StatusBox";
import "../styles/LoginPage.css";
import "../styles/UsersPage.css";

const roleLabels = {
  admin: "Administrador",
  employee: "Empleado",
};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCedulaParts(id = "") {
  const match = /^([VE]-)(\d+)$/.exec(id);
  return { prefix: match?.[1] ?? "V-", number: match?.[2] ?? "" };
}

function renderDeleteConfirmation(user, container, onConfirm) {
  container.innerHTML = /*html*/ `
    <section class="user-editor-card" aria-labelledby="delete-user-title">
      <h2 id="delete-user-title">Eliminar usuario</h2>
      <p>¿Deseas eliminar a <strong>${escapeHTML(user.email)}</strong>? Esta acción no se puede deshacer.</p>
      ${renderStatusBox()}
      <div class="user-form-actions">
        <button class="button button--primary" type="button" data-confirm-delete>Eliminar</button>
        <button class="button" type="button" data-cancel-editor>Cancelar</button>
      </div>
    </section>
  `;

  const statusBox = bindStatusBox(container);
  container.querySelector("[data-cancel-editor]").addEventListener("click", () =>
    container.replaceChildren()
  );
  container.querySelector("[data-confirm-delete]").addEventListener("click", async () => {
    try {
      await onConfirm(user.id);
      container.replaceChildren();
    } catch (error) {
      statusBox.show(error.message);
    }
  });
}

function renderUserForm(user, container, onSubmit, onSendOTP) {
  const editing = user !== null;
  const cedula = getCedulaParts(user?.id);

  container.innerHTML = /*html*/ `
    <section class="user-editor-card" aria-labelledby="user-form-title">
      <header>
        <p class="users-eyebrow">${editing ? "Editar cuenta" : "Nueva cuenta"}</p>
        <h2 id="user-form-title">${editing ? "Modificar usuario" : "Registrar usuario"}</h2>
      </header>

      <form class="user-form" data-user-form>
        <div class="form-field">
          <label id="user-id-label" for="user-id-number">Cédula de identidad</label>
          <div class="cedula-input">
            <select name="idPrefix" aria-label="Nacionalidad" ${editing ? "disabled" : ""} required>
              <option value="V-" ${cedula.prefix === "V-" ? "selected" : ""}>V-</option>
              <option value="E-" ${cedula.prefix === "E-" ? "selected" : ""}>E-</option>
            </select>
            <input id="user-id-number" name="idNumber" type="number" inputmode="numeric" autocomplete="username" aria-labelledby="user-id-label" min="1" max="100000000" step="1" value="${escapeHTML(cedula.number)}" placeholder="12345678" ${editing ? "disabled" : ""} required>
          </div>
        </div>

        <div class="form-field">
          <label for="user-email">Correo electrónico</label>
          <input id="user-email" name="email" type="email" autocomplete="email" value="${escapeHTML(user?.email)}" placeholder="tu@correo.electronico" maxlength="40" required>
        </div>

        ${
          editing
            ? ""
            : /*html*/ `
              <div class="form-field">
                <label for="user-otp">Código OTP</label>
                <div class="otp-input">
                  <input id="user-otp" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" placeholder="000000" required>
                  <button class="button" type="button" data-send-otp>Enviar OTP</button>
                </div>
              </div>
            `
        }

        <div class="form-field">
          <label for="user-password">Contraseña</label>
          <input id="user-password" name="password" type="password" autocomplete="new-password" placeholder="●●●●●●●●" maxlength="20" ${editing ? "" : "required"}>
          ${editing ? '<small>Déjala vacía para conservar la contraseña actual.</small>' : ""}
        </div>

        <div class="form-field">
          <label for="user-role">Nivel de usuario</label>
          <select id="user-role" name="role" required>
            <option value="employee" ${user?.role === "employee" ? "selected" : ""}>Empleado</option>
            <option value="admin" ${user?.role === "admin" ? "selected" : ""}>Administrador</option>
          </select>
        </div>

        ${renderStatusBox()}

        <div class="user-form-actions">
          <button class="button button--primary" type="submit">${editing ? "Guardar cambios" : "Registrar usuario"}</button>
          <button class="button" type="button" data-cancel-editor>Cancelar</button>
        </div>
      </form>
    </section>
  `;

  const form = container.querySelector("[data-user-form]");
  const statusBox = bindStatusBox(container);
  const sendOTPButton = container.querySelector("[data-send-otp]");

  container.querySelector("[data-cancel-editor]").addEventListener("click", () =>
    container.replaceChildren()
  );

  sendOTPButton?.addEventListener("click", async () => {
    const emailInput = form.elements.email;
    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    sendOTPButton.disabled = true;
    try {
      await onSendOTP(emailInput.value);
      statusBox.show("Código OTP enviado. Revisa tu correo electrónico.", "success");
    } catch (error) {
      statusBox.show(error.message);
    } finally {
      sendOTPButton.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const submittedUser = {
      ...values,
      id: editing ? user.id : `${values.idPrefix}${values.idNumber}`,
    };
    delete submittedUser.idPrefix;
    delete submittedUser.idNumber;

    try {
      await onSubmit(submittedUser);
    } catch (error) {
      statusBox.show(error.message);
    }
  });
}

function renderUsers(users, container, currentUserId) {
  if (users.length === 0) {
    container.innerHTML = '<p class="users-empty">No hay usuarios registrados.</p>';
    return;
  }

  container.innerHTML = /*html*/ `
    <div class="users-table-wrap">
      <table class="users-table">
        <thead><tr><th>Cédula</th><th>Correo electrónico</th><th>Nivel</th><th>Acciones</th></tr></thead>
        <tbody>
          ${users
            .map((user) => {
              const isCurrent = user.id === currentUserId;
              return /*html*/ `
                <tr>
                  <td>${escapeHTML(user.id)}</td>
                  <td>${escapeHTML(user.email)}</td>
                  <td>${escapeHTML(roleLabels[user.role] ?? user.role)}</td>
                  <td class="users-actions">
                    <button class="button" type="button" data-edit-user="${escapeHTML(user.id)}">Editar</button>
                    <button class="button" type="button" data-delete-user="${escapeHTML(user.id)}" ${isCurrent ? 'disabled title="No puedes eliminar tu propia cuenta"' : ""}>Eliminar</button>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

export default function renderUsersPage(authService, emailService, container) {
  container.innerHTML = /*html*/ `
    <main class="users-page">
      <section class="users-card" aria-labelledby="users-title">
        <header class="users-header">
          <div>
            <p class="users-eyebrow">Administración</p>
            <h1 id="users-title">Usuarios</h1>
            <p>Registra y administra las cuentas con acceso al sistema.</p>
          </div>
          <div class="users-header-actions">
            <a class="button" href="/dashboard" data-link>Volver al panel</a>
            <button class="button button--primary" type="button" data-register-user>Registrar usuario</button>
          </div>
        </header>
        ${renderStatusBox()}
        <section data-users-list></section>
        <section class="user-editor" data-user-editor></section>
      </section>
    </main>
  `;

  const page = container.querySelector(".users-page");
  const usersList = page.querySelector("[data-users-list]");
  const editor = page.querySelector("[data-user-editor]");
  const pageStatus = bindStatusBox(page);
  const currentUser = authService.getCurrentUser();

  const refreshUsers = () =>
    renderUsers(authService.getUsers(), usersList, currentUser?.id);

  const finishAction = (message) => {
    refreshUsers();
    editor.replaceChildren();
    pageStatus.show(message, "success");
  };

  refreshUsers();

  page.addEventListener("click", (event) => {
    const registerButton = event.target.closest("[data-register-user]");
    const editButton = event.target.closest("[data-edit-user]");
    const deleteButton = event.target.closest("[data-delete-user]");

    if (registerButton) {
      renderUserForm(
        null,
        editor,
        (user) => {
          authService.register(user);
          finishAction("Usuario registrado correctamente.");
        },
        async (email) => {
          const otp = authService.generateOTP(email);
          await emailService.sendOTP(email, otp, "10 minutos");
        }
      );
      return;
    }

    if (editButton) {
      const user = authService
        .getUsers()
        .find((candidate) => candidate.id === editButton.dataset.editUser);
      if (!user) {
        pageStatus.show("No se encontró el usuario seleccionado.");
        return;
      }
      renderUserForm(user, editor, (updatedUser) => {
        authService.editUser(updatedUser);
        finishAction("Usuario actualizado correctamente.");
      });
      return;
    }

    if (deleteButton && !deleteButton.disabled) {
      const user = authService
        .getUsers()
        .find((candidate) => candidate.id === deleteButton.dataset.deleteUser);
      if (!user) {
        pageStatus.show("No se encontró el usuario seleccionado.");
        return;
      }
      renderDeleteConfirmation(user, editor, (id) => {
        authService.deleteUser(id);
        finishAction("Usuario eliminado correctamente.");
      });
    }
  });
}
