export class FuelTank {
  constructor(quantity) {
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new Error("La cantidad de combustible es inválida.");
    }

    this.quantity = quantity;
  }

  getQuantity() {
    return this.quantity;
  }

  supply(quantity) {
    this.#validateQuantity(quantity);
    this.quantity += quantity;
    return this.quantity;
  }

  consume(quantity) {
    this.#validateQuantity(quantity);

    if (this.quantity < quantity) {
      throw new Error("No hay suficiente combustible en el tanque.");
    }

    this.quantity -= quantity;
    return this.quantity;
  }

  #validateQuantity(quantity) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("La cantidad de combustible es inválida.");
    }
  }
}

export default class InventoryService {
  #permissions = {
    assignFuel: [null],
    getTank: ["employee", "admin"],
  };

  #tanks = {
    motorbike_regular: new FuelTank(0),
    truck_diesel: new FuelTank(0),
    car_regular: new FuelTank(0),
  };

  constructor(initTanks) {
    if (
      !initTanks ||
      !Object.values(initTanks).every((tank) => tank instanceof FuelTank)
    ) {
      throw new Error("Los tanques de combustible son inválidos.");
    }

    this.#tanks = initTanks;
  }

  assignFuel(quantity, key) {
    return this.getTank(key).consume(quantity);
  }

  getTank(key) {
    if (key === undefined || key === null || key === "") {
      return this.#tanks;
    }

    const tank = this.#tanks[key];

    if (!tank) {
      throw new Error(`El tanque "${key}" no existe.`);
    }

    return tank;
  }

  getPermissions() {
    return Object.fromEntries(
      Object.entries(this.#permissions).map(([action, roles]) => [
        action,
        [...roles],
      ])
    );
  }
}
