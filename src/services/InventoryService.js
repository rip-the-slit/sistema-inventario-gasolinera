const MINIMUM_GAS_LEVELS_LT = 1900;

export class FuelTank {
  constructor(quantity = 0) {
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
    return quantity;
  }

  #validateQuantity(quantity) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("La cantidad de combustible es inválida.");
    }
  }
}

export default class InventoryService {
  #permissions = {
    assignFuel: [null, "employee", "admin"],
    getAssignedLtPerVehicle: [null, "employee", "admin"],
    setAssignedLtPerVehicle: [null, "employee", "admin"],
    isSupplied: [null, "employee", "admin"],
    getTank: ["employee", "admin"],
  };

  #fuelTank = new FuelTank(0);

  #assignedLtPerVehicleType = {
    motorbike: 5,
    truck: 50,
    car: 25,
  };

  constructor(initTank = new FuelTank(0)) {
    if (!(initTank instanceof FuelTank)) {
      throw new Error("El tanque de combustible es inválido.");
    }

    this.#fuelTank = initTank;
  }

  assignFuel(type) {
    const quantity = this.#assignedLtPerVehicleType[type];

    if (quantity === undefined) {
      throw new Error(`El tipo de vehículo "${type}" no es válido.`);
    }

    return this.getTank().consume(quantity);
  }

  getTank() {
    return this.#fuelTank;
  }

  getAssignedLtPerVehicle() {
    return { ...this.#assignedLtPerVehicleType };
  }

  setAssignedLtPerVehicle(newObject) {
    const expectedTypes = Object.keys(this.#assignedLtPerVehicleType);
    const receivedTypes = Object.keys(newObject ?? {});

    if (
      receivedTypes.length !== expectedTypes.length ||
      !expectedTypes.every((type) => receivedTypes.includes(type))
    ) {
      throw new Error("La asignación debe incluir cada tipo de vehículo.");
    }

    const normalized = Object.fromEntries(
      Object.entries(newObject).map(([type, value]) => [type, Number(value)])
    );

    if (
      !Object.values(normalized).every(
        (lt) => Number.isFinite(lt) && lt > 0
      )
    ) {
      throw new Error("Los litros por vehículo deben ser mayores a 0.");
    }

    this.#assignedLtPerVehicleType = normalized;
    return this.getAssignedLtPerVehicle();
  }

  getPermissions() {
    return Object.fromEntries(
      Object.entries(this.#permissions).map(([action, roles]) => [
        action,
        [...roles],
      ])
    );
  }

  isSupplied() {
    return this.#fuelTank.getQuantity() > MINIMUM_GAS_LEVELS_LT;
  }
}
