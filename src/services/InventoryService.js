import Service from "./Service.js";

const MINIMUM_GAS_LEVELS_LT = 1900;

export class FuelTank extends Service {
  constructor(quantity) {
    super();
    const savedQuantity = this.readStorage("fuelQuantity", 0);
    const initialQuantity = quantity === undefined ? savedQuantity : Number(quantity);

    if (!Number.isFinite(initialQuantity) || initialQuantity < 0) {
      throw new Error("La cantidad de combustible es inválida.");
    }

    this.quantity = initialQuantity;
    this.#save();
  }

  getQuantity() {
    return this.quantity;
  }

  supply(quantity) {
    this.#validateQuantity(quantity);
    this.quantity += quantity;
    this.#save();
    return this.quantity;
  }

  consume(quantity) {
    this.#validateQuantity(quantity);

    if (this.quantity < quantity) {
      throw new Error("No hay suficiente combustible en el tanque.");
    }

    this.quantity -= quantity;
    this.#save();
    return quantity;
  }

  #validateQuantity(quantity) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("La cantidad de combustible es inválida.");
    }
  }

  #save() {
    this.writeStorage("fuelQuantity", this.quantity);
  }
}

export default class InventoryService extends Service {
  #fuelTank;

  #assignedLtPerVehicleType = {
    motorbike: 5,
    truck: 50,
    car: 25,
  };

  constructor() {
    super({
      assignFuel: [null, "employee", "admin"],
      getAssignedLtPerVehicle: [null, "employee", "admin"],
      setAssignedLtPerVehicle: [null, "employee", "admin"],
      isSupplied: [null, "employee", "admin"],
      getTank: ["employee", "admin"],
    });

    this.#fuelTank = new FuelTank();

    const savedAssignments = this.readStorage("assignedLtPerVehicle", null);
    if (this.#isValidAssignments(savedAssignments)) {
      this.#assignedLtPerVehicleType = Object.fromEntries(
        Object.entries(savedAssignments).map(([type, value]) => [
          type,
          Number(value),
        ])
      );
    }

    this.#saveAssignments();
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
    this.#saveAssignments();
    return this.getAssignedLtPerVehicle();
  }

  isSupplied() {
    return this.#fuelTank.getQuantity() > MINIMUM_GAS_LEVELS_LT;
  }

  #isValidAssignments(assignments) {
    if (!assignments || typeof assignments !== "object") return false;

    const expectedTypes = Object.keys(this.#assignedLtPerVehicleType);
    const receivedTypes = Object.keys(assignments);
    return (
      receivedTypes.length === expectedTypes.length &&
      expectedTypes.every(
        (type) =>
          receivedTypes.includes(type) &&
          Number.isFinite(Number(assignments[type])) &&
          Number(assignments[type]) > 0
      )
    );
  }

  #saveAssignments() {
    this.writeStorage("assignedLtPerVehicle", this.#assignedLtPerVehicleType);
  }
}
