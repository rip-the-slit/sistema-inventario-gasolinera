export default class Service {
  #permissions;

  constructor(permissions = {}) {
    this.#permissions = permissions;
  }

  getPermissions() {
    return Object.fromEntries(Object.entries(this.#permissions).map(([action, roles]) => [action, [...roles]]));
  }

  async request(endpoint, action, data = {}, method = "GET") {
    const url = new URL(`api/${endpoint}.php`, document.baseURI);
    url.searchParams.set("action", action);
    const options = { method, credentials: "same-origin" };
    if (method === "GET") {
      for (const [key, value] of Object.entries(data)) {
        url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : value);
      }
    } else {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(data);
    }
    const response = await fetch(url, options);
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("El servidor no devolvió una respuesta válida.");
    }
    if (!response.ok) throw new Error(result.error || "No fue posible completar la operación.");
    return result.data;
  }
}
