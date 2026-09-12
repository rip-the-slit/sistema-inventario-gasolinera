export class User {
  constructor(id, email, password, role, fullName = null) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.role = role;
    this.fullName = fullName;
  }
}

export default class AuthService extends Service {
  #current = null;

  #users = [
    new User("V-1", "admin@example.com", "admin123", "admin"),
    new User("E-1", "employee@example.com", "employee123", "employee"),
  ];

  #otps = [];

  constructor() {
    super({
      register: ["admin"],
      login: [null],
      getCurrentUser: [null, "employee", "admin"],
      getUsers: ["admin"],
      editUser: ["admin"],
      deleteUser: ["admin"],
      generateOTP: ["admin"],
      validateOTP: ["admin"],
    });

    const storedUsers = this.readStorage("users", null);
    if (Array.isArray(storedUsers) && storedUsers.length > 0) {
      this.#users = storedUsers.map(
        ({ id, email, password, role, fullName }) =>
          new User(id, email, password, role, fullName)
      );
    }

    const storedCurrentUser = this.readStorage("currentUser", null);
    if (storedCurrentUser?.id) {
      this.#current = this.#users.find(
        (user) => user.id === storedCurrentUser.id
      ) ?? null;
    }
  }

  register({ id, email, password, role, otp }) {
    if (!this.#isValidUserData({ id, email, password, role })) {
      throw new TypeError(
        "ID, correo, contraseña, y rol válidos son requeridos."
      );
    }

    if (this.#users.some((user) => user.id === id || user.email === email)) {
      throw new Error("Un usuario con el mismo ID o correo ya existe.");
    }

    this.validateOTP(otp, email);

    const user = new User(id, email, password, role);
    this.#users.push(user);
    this.#saveUsers();
    return this.#toPublicUser(user);
  }

  login({ id, email, password } = {}) {
    if (![id, email, password].every(this.#isNonEmptyString)) {
      throw new Error("Ingresa un ID, correo y contraseña válidos.");
    }

    const user = this.#users.find(
      (candidate) =>
        candidate.id === id &&
        candidate.email === email &&
        candidate.password === password
    );

    if (!user) throw new Error("Las credenciales no son válidas.");

    this.#current = user;
    this.#saveCurrentUser();
    return this.#toPublicUser(user);
  }

  logout() {
    this.#current = null;
    this.removeStorage("currentUser");
  }

  getCurrentUser() {
    return this.#current ? this.#toPublicUser(this.#current) : null;
  }

  getUsers() {
    return this.#users.map((u) => this.#toPublicUser(u));
  }

  editUser({ id, email, password, role }) {
    if (!this.#isNonEmptyString(id)) {
      throw new TypeError("La ID es requerida.");
    }

    const user = this.#users.find((u) => u.id === id);

    if (!user) {
      throw new Error("No existe un usuario con el ID especificado.");
    }

    this.#isNonEmptyString(email) && (user.email = email);
    this.#isNonEmptyString(password) && (user.password = password);
    this.#isNonEmptyString(role) &&
      ["employee", "admin"].includes(role) &&
      (user.role = role);

    this.#saveUsers();
    if (this.#current?.id === user.id) this.#saveCurrentUser();
  }

  deleteUser(id) {
    if (!this.#isNonEmptyString(id)) {
      throw new TypeError("La ID es requerida.");
    }

    if (this.#current?.id === id) {
      throw new Error("No puedes eliminar tu propio usuario mientras tienes la sesión iniciada.");
    }

    const index = this.#users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error("No existe un usuario con el ID especificado.");
    }

    this.#users.splice(index, 1);
    this.#saveUsers();
  }

  generateOTP(email) {
    if (!this.#isNonEmptyString(email)) {
      throw new Error("Ingresa un correo válido.");
    }
    const otp = Math.floor(Math.random() * 900000) + 100000;
    this.#otps.push({ email, otp: String(otp), createdAt: Date.now() });
    return otp;
  }

  validateOTP(otp, email) {
    if (!this.#isNonEmptyString(otp)) {
      throw new Error("Ingresa un código OTP válido.");
    }

    const otpEntry = this.#otps.find(
      (entry) =>
        entry.otp === String(otp) &&
        entry.email === email &&
        Date.now() - entry.createdAt < 600000
    );

    if (!otpEntry) {
      throw new Error("El código OTP no es válido o ha expirado.");
    }

    return true;
  }

  #isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  #isValidUserData({ id, email, password, role }) {
    return (
      [id, email, password].every(this.#isNonEmptyString) &&
      this.#isValidCedula(id) &&
      ["employee", "admin"].includes(role)
    );
  }

  #isValidCedula(id) {
    return /^[VE]-(?:[1-9]\d{0,7}|100000000)$/.test(id);
  }

  #toPublicUser({ id, email, role }) {
    return { id, email, role };
  }

  #saveUsers() {
    this.writeStorage("users", this.#users);
  }

  #saveCurrentUser() {
    this.writeStorage("currentUser", this.#toPublicUser(this.#current));
  }
}
import Service from "./Service.js";
