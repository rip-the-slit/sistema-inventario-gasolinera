import Service from "./Service.js";

export class FuelTank extends Service {
  getQuantity() { return this.request("InventoryService", "getQuantity"); }
  supply(quantity) { return this.request("InventoryService", "supply", { quantity }, "POST"); }
  consume(quantity) { return this.request("InventoryService", "consume", { quantity }, "POST"); }
}

export default class InventoryService extends Service {
  constructor() {
    super({
      assignFuel: ["employee", "admin"],
      getAssignedLtPerVehicle: [null, "employee", "admin"],
      setAssignedLtPerVehicle: ["employee", "admin"],
      isSupplied: [null, "employee", "admin"],
      getTank: ["employee", "admin"],
    });
  }

  assignFuel(type) { return this.request("InventoryService", "assignFuel", { type }, "POST"); }
  async getTank() {
    await this.request("InventoryService", "getTank");
    return new FuelTank();
  }
  getAssignedLtPerVehicle() { return this.request("InventoryService", "getAssignedLtPerVehicle"); }
  setAssignedLtPerVehicle(values) { return this.request("InventoryService", "setAssignedLtPerVehicle", values, "POST"); }
  isSupplied() { return this.request("InventoryService", "isSupplied"); }
}
