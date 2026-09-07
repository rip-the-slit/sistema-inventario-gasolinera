export class Ticket {
  constructor(emissionDate, id, vehicle, status, verificationCode, ) {
    this.emissionDate = emissionDate;
    this.id = id;
    this.vehicle = vehicle;
    this.status = status;
    this.verificationCode = verificationCode;
  }
}

class Vehicle {
  constructor(type, brand, model, plateNumber, colour) {
    this.type = type;
    this.brand = brand;
    this.model = model;
    this.plateNumber = plateNumber;
    this.colour = colour;
  }

  assignFuel() {
    throw new Error("El tipo de vehículo no admite asignación de combustible.");
  }
}

export class Motorbike extends Vehicle {
  constructor(brand, model, plateNumber, colour) {
    super("Motorbike", brand, model, plateNumber, colour);
  }

  assignFuel(quantity, inventoryService) {
    return inventoryService.assignFuel(quantity, "motorbike_regular");
  }
}

export class Truck extends Vehicle {
  constructor(brand, model, plateNumber, colour) {
    super("Truck", brand, model, plateNumber, colour);
  }

  assignFuel(quantity, inventoryService) {
    return inventoryService.assignFuel(quantity, "truck_diesel");
  }
}

export class Car extends Vehicle {
  constructor(brand, model, plateNumber, colour) {
    super("Car", brand, model, plateNumber, colour);
  }

  assignFuel(quantity, inventoryService) {
    return inventoryService.assignFuel(quantity, "car_regular");
  }
}

const vehicleClasses = {
  motorbike: Motorbike,
  truck: Truck,
  car: Car,
};

export default class TicketService {
  #permissions = {
    generateTicket: [null],
    getTickets: ["employee", "admin"],
    getSupplySchedule: [null, "employee", "admin"],
    setSupplySchedule: ["employee", "admin"],
  };

  #tickets = [];

  #ids = new Set(Array.from({ length: 20 }, (_, i) => i + 1));
  #verificationCodes = new Set(
    Array.from({ length: 999 }, (_, i) => i.toString().padStart(2, "0"))
  );

  constructor(
    initTickets = [],
    inventoryService,
    supplySchedule = { start: null, end: null }
  ) {
    if (
      !Array.isArray(initTickets) ||
      !initTickets.every((ticket) => ticket instanceof Ticket)
    ) {
      throw new Error("Tickets de inicialización inválidos.");
    }

    if (
      !inventoryService ||
      typeof inventoryService.assignFuel !== "function"
    ) {
      throw new Error("El servicio de inventario es inválido.");
    }

    this.#tickets = [...initTickets];
    this.inventoryService = inventoryService;
    this.supplySchedule = this.#validateSupplySchedule(supplySchedule);
  }

  generateTicket({
    id,
    vehicle: vehicleData = {},
    vehicleType,
    type,
    brand,
    model,
    plateNumber,
    colour,
    status,
    quantity,
    verificationCode,
  } = {}) {
    const resolvedType = vehicleType ?? type ?? vehicleData.type;
    const VehicleClass = vehicleClasses[String(resolvedType).toLowerCase()];

    if (!VehicleClass) {
      throw new Error(`El tipo de vehículo "${resolvedType}" no es válido.`);
    }

    id = null;
    const emissionDate = new Date().toDateString();
    const vehicle = new VehicleClass(
      brand ?? vehicleData.brand,
      model ?? vehicleData.model,
      plateNumber ?? vehicleData.plateNumber,
      colour ?? vehicleData.colour
    );

    try {
      verificationCode = this.getRandomVerificationCode();
      if (status || status.success) {
        vehicle.assignFuel(quantity, this.inventoryService);
        id = this.getRandomId(emissionDate);
        status = { succes: true, type, quantity };
      }
    } catch (error) {
      status = { success: false, message: error.message };
    }

    const ticket = new Ticket(
      emissionDate,
      id,
      vehicle,
      status,
      verificationCode,
      rowId
    );

    this.#tickets.push(ticket);
    return ticket;
  }

  getTickets(filters = {}) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
      throw new TypeError("Los filtros deben ser un objeto.");
    }

    return this.#tickets.filter((ticket) =>
      Object.entries(filters).every(([attribute, expected]) => {
        if (attribute === "vehicle" && this.#isObject(expected)) {
          return Object.entries(expected).every(
            ([vehicleAttribute, value]) =>
              Object.hasOwn(ticket.vehicle, vehicleAttribute) &&
              this.#matches(ticket.vehicle[vehicleAttribute], value)
          );
        }

        if (Object.hasOwn(ticket, attribute)) {
          return this.#matches(ticket[attribute], expected);
        }

        if (Object.hasOwn(ticket.vehicle, attribute)) {
          return this.#matches(ticket.vehicle[attribute], expected);
        }

        return false;
      })
    );
  }

  getRandomId(dateString) {
    const dateTickets = this.getTickets({ emissionDate: dateString });
    const takenIds = new Set(dateTickets.map((ticket) => ticket.id));
    const idsLeft = Array.from(this.#ids.difference(takenIds).values());

    if (idsLeft.size === 0) {
      throw new Error("No hay más turnos disponibles.");
    }

    const randomIndex = Math.floor(Math.random() * idsLeft.length);

    return idsLeft[randomIndex];
  }

  getRandomVerificationCode() {
    const tickets = this.getTickets();
    const takenCodes = new Set(
      tickets.map((ticket) => ticket.verificationCode)
    );
    const codesLeft = Array.from(
      this.#verificationCodes.difference(takenCodes).values()
    );

    if (codesLeft.size === 0) {
      throw new Error("No hay más códigos disponibles.");
    }

    const randomIndex = Math.floor(Math.random() * codesLeft.length);

    return codesLeft[randomIndex];
  }

  getSupplySchedule() {
    return { ...this.supplySchedule };
  }

  setSupplySchedule(supplySchedule) {
    this.supplySchedule = this.#validateSupplySchedule(supplySchedule);
    return this.getSupplySchedule();
  }

  getPermissions() {
    return Object.fromEntries(
      Object.entries(this.#permissions).map(([action, roles]) => [
        action,
        [...roles],
      ])
    );
  }

  #validateSupplySchedule(supplySchedule) {
    if (
      !this.#isObject(supplySchedule) ||
      !Object.hasOwn(supplySchedule, "start") ||
      !Object.hasOwn(supplySchedule, "end")
    ) {
      throw new TypeError(
        "El horario de suministro debe incluir una hora de inicio y fin."
      );
    }

    const { start, end } = supplySchedule;
    return { start, end };
  }

  #isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  #matches(actual, expected) {
    if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();
    }

    return actual === expected;
  }
}
