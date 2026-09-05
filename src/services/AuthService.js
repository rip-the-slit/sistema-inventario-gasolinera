class User {
  constructor(id, email, password, role, fullName = null) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.role = role;
    this.fullName = fullName;
  }
}

export default class AuthService {
  #permissions = {
    register: ["admin"],
    login: [null],
    getCurrentUser: [null, "employee", "admin"],
  };

  #current = null;

  #users = [
    new User("V-1", "admin@example.com", "admin123", "admin"),
    new User("E-1", "employee@example.com", "employee123", "employee"),
  ];

  register({ id, email, password, role }) {
    if (!this.#isValidUserData({ id, email, password, role })) {
      throw new TypeError("ID, correo, contraseña, y rol válidos son requeridos.");
    }

    if (this.#users.some((user) => user.id === id || user.email === email)) {
      throw new Error("Un usuario con el mismo ID o correo ya existe.");
    }

    const user = new User(id, email, password, role);
    this.#users.push(user);
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
    return this.#toPublicUser(user);
  }

  getCurrentUser() {
    return this.#current ? this.#toPublicUser(this.#current) : null;
  }

  getPermissions() {
    return Object.fromEntries(
      Object.entries(this.#permissions).map(([action, roles]) => [action, [...roles]])
    );
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
}
