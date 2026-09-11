export default class EmailService {
  #permissions = {
    sendOTP: ["admin"],
  };

  #serviceId = null;

  constructor() {
    emailjs.init({publicKey: process.env.EMAILJS_SECRET});
    this.#serviceId = process.env.EMAILJS_SERVICEID || "default_service";
  }

  async sendOTP(email, passcode, time) {
    if (!emailjs?.send) {
      throw new Error("El servicio de correo no está disponible.");
    }

    try {
      return await emailjs.send(this.#serviceId, "template_3f43xaq", {
        email,
        passcode,
        time,
      });
    } catch(e) {
      throw new Error(e.text)
    }
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
