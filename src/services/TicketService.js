export class Ticket {
  constructor(emissionDate, id, vehicle, status, verificationCode) {
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

  assignFuel(inventoryService) {
    return inventoryService.assignFuel("motorbike");
  }
}

export class Truck extends Vehicle {
  constructor(brand, model, plateNumber, colour) {
    super("Truck", brand, model, plateNumber, colour);
  }

  assignFuel(inventoryService) {
    return inventoryService.assignFuel("truck");
  }
}

export class Car extends Vehicle {
  constructor(brand, model, plateNumber, colour) {
    super("Car", brand, model, plateNumber, colour);
  }

  assignFuel(inventoryService) {
    return inventoryService.assignFuel("car");
  }
}

const vehicleClasses = {
  motorbike: Motorbike,
  truck: Truck,
  car: Car,
};

export default class TicketService extends Service {
  #tickets = [];

  #ids = new Set(Array.from({ length: 20 }, (_, i) => i + 1));
  #verificationCodes = new Set(
    Array.from({ length: 900 }, (_, i) => String(i + 100))
  );

  constructor(inventoryService) {
    super({
      generateTicket: [null, "employee", "admin"],
      getTickets: [null, "employee", "admin"],
      getSupplySchedule: [null, "employee", "admin"],
      setSupplySchedule: ["employee", "admin"],
    });

    if (
      !inventoryService ||
      typeof inventoryService.assignFuel !== "function"
    ) {
      throw new Error("El servicio de inventario es inválido.");
    }

    this.inventoryService = inventoryService;
    const savedTickets = this.readStorage("tickets", []);
    this.#tickets = (Array.isArray(savedTickets) ? savedTickets : [])
      .map((ticket) => this.#hydrateTicket(ticket))
      .filter(Boolean);

    const savedSchedule = this.readStorage("supplySchedule", {
      start: null,
      end: null,
    });
    try {
      this.supplySchedule = this.#validateSupplySchedule(savedSchedule);
    } catch {
      this.supplySchedule = { start: null, end: null };
    }

    this.#saveTickets();
    this.#saveSupplySchedule();
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
    verificationCode,
  } = {}) {
    const resolvedType = vehicleType ?? type ?? vehicleData.type;
    const VehicleClass = vehicleClasses[String(resolvedType).toLowerCase()];

    if (!VehicleClass) {
      throw new Error(`El tipo de vehículo "${resolvedType}" no es válido.`);
    }

    const emissionDate = new Date().toDateString();
    const vehicle = new VehicleClass(
      brand ?? vehicleData.brand,
      model ?? vehicleData.model,
      plateNumber ?? vehicleData.plateNumber,
      colour ?? vehicleData.colour
    );

    try {
      verificationCode = this.getRandomVerificationCode();
      id = this.getRandomId(emissionDate);
      const accepted = status === undefined || status?.success !== false;

      if (accepted) {
        const quantity = vehicle.assignFuel(this.inventoryService);
        status = { success: true, type: vehicle.type, quantity };
      }
    } catch (error) {
      status = { success: false, message: error.message };
    }

    const ticket = new Ticket(
      emissionDate,
      id,
      vehicle,
      status,
      verificationCode
    );

    this.#tickets.push(ticket);
    this.#saveTickets();
    return ticket;
  }

  getTickets(filters = {}) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
      throw new TypeError("Los filtros deben ser un objeto.");
    }

    return this.#tickets.filter((ticket) =>
      Object.entries(filters).every(([attribute, expected]) => {
        if (
          (attribute === "vehicle" || attribute === "status") &&
          this.#isObject(expected)
        ) {
          const source = ticket[attribute];
          return Object.entries(expected).every(
            ([nestedAttribute, value]) =>
              this.#isObject(source) &&
              Object.hasOwn(source, nestedAttribute) &&
              this.#matches(source[nestedAttribute], value)
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
    const idsLeft = [...this.#ids].filter((id) => !takenIds.has(id));

    if (idsLeft.length === 0) {
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
    const codesLeft = [...this.#verificationCodes].filter(
      (code) => !takenCodes.has(code)
    );

    if (codesLeft.length === 0) {
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
    this.#saveSupplySchedule();
    return this.getSupplySchedule();
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

  #hydrateTicket(ticket) {
    if (!this.#isObject(ticket) || !this.#isObject(ticket.vehicle)) {
      return null;
    }

    const VehicleClass = vehicleClasses[String(ticket.vehicle.type).toLowerCase()];
    if (!VehicleClass) return null;

    const id = Number(ticket.id);
    if (!Number.isInteger(id) || id < 1 || id > 20) return null;

    const verificationCode = String(ticket.verificationCode ?? "");
    if (!/^\d{3}$/.test(verificationCode)) return null;

    const vehicle = new VehicleClass(
      ticket.vehicle.brand,
      ticket.vehicle.model,
      ticket.vehicle.plateNumber,
      ticket.vehicle.colour
    );
    return new Ticket(
      ticket.emissionDate,
      id,
      vehicle,
      this.#isObject(ticket.status) ? ticket.status : { success: false },
      verificationCode
    );
  }

  #saveTickets() {
    this.writeStorage("tickets", this.#tickets);
  }

  #saveSupplySchedule() {
    this.writeStorage("supplySchedule", this.supplySchedule);
  }
}
import Service from "./Service.js";
