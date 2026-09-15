/* global process */

import Service from "./Service.js";

export default class EmailService extends Service {
  #serviceId = null;
  #client = null;

  constructor() {
    super({ sendOTP: ["admin"] });
    this.#client = globalThis.emailjs;
    const publicKey =
      process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_SECRET;

    this.#client?.init({ publicKey });
    this.#serviceId = process.env.EMAILJS_SERVICEID || "default_service";
  }

  async sendOTP(email, passcode, time) {
    if (!this.#client?.send) {
      throw new Error("El servicio de correo no está disponible.");
    }

    try {
      return await this.#client.send(this.#serviceId, "template_3f43xaq", {
        email,
        passcode,
        time,
      });
    } catch(e) {
      throw new Error(e.text)
    }
  }

}
