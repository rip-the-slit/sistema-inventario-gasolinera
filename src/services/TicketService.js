import Service from "./Service.js";

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

  async assignFuel() {
    throw new Error("El tipo de vehículo no admite asignación de combustible.");
  }
}

export class Motorbike extends Vehicle {
  constructor(brand, model, plateNumber, colour) {
    super("Motorbike", brand, model, plateNumber, colour);
  }

  async assignFuel(inventoryService) {
    return inventoryService.assignFuel("motorbike");
  }
}

export class Truck extends Vehicle {
  constructor(brand, model, plateNumber, colour) {
    super("Truck", brand, model, plateNumber, colour);
  }

  async assignFuel(inventoryService) {
    return inventoryService.assignFuel("truck");
  }
}

export class Car extends Vehicle {
  constructor(brand, model, plateNumber, colour) {
    super("Car", brand, model, plateNumber, colour);
  }

  async assignFuel(inventoryService) {
    return inventoryService.assignFuel("car");
  }
}

export default class TicketService extends Service {
  constructor(inventoryService) {
    super({
      generateTicket: [null, "employee", "admin"],
      getTickets: [null, "employee", "admin"],
      getSupplySchedule: [null, "employee", "admin"],
      setSupplySchedule: ["employee", "admin"],
    });
    this.inventoryService = inventoryService;
  }

  generateTicket(data = {}) { return this.request("TicketService", "generateTicket", data, "POST"); }
  getTickets(filters = {}) { return this.request("TicketService", "getTickets", { filters }); }
  getSupplySchedule() { return this.request("TicketService", "getSupplySchedule"); }
  setSupplySchedule(schedule) { return this.request("TicketService", "setSupplySchedule", schedule, "POST"); }
}
