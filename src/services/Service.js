export default class Service {
  #permissions;

  constructor(permissions = {}) {
    this.#permissions = Object.fromEntries(
      Object.entries(permissions).map(([action, roles]) => [
        action,
        Array.isArray(roles) ? [...roles] : [],
      ])
    );
  }

  getPermissions() {
    return Object.fromEntries(
      Object.entries(this.#permissions).map(([action, roles]) => [
        action,
        [...roles],
      ])
    );
  }

  readStorage(key, fallback = null) {
    try {
      const value = globalThis.sessionStorage?.getItem(key);
      return value === null || value === undefined ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  writeStorage(key, value) {
    try {
      globalThis.sessionStorage?.setItem(key, JSON.stringify(value));
    } catch {
      // La aplicación sigue siendo utilizable si el almacenamiento no está disponible.
    }
  }

  removeStorage(key) {
    try {
      globalThis.sessionStorage?.removeItem(key);
    } catch {
      // La aplicación sigue siendo utilizable si el almacenamiento no está disponible.
    }
  }
}
