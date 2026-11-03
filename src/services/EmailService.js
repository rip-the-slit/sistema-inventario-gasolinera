import Service from "./Service.js";

export default class EmailService extends Service {
  constructor() {
    super({ sendOTP: ["admin"] });
  }

  async sendOTP(email, passcode, time) {
    const client = globalThis.emailjs;
    if (!client?.send) throw new Error("El servicio de correo no está disponible.");
    const { publicKey, serviceId } = await this.request("EmailService", "getCredentials");
    client.init({ publicKey });
    try {
      return await client.send(serviceId, "template_3f43xaq", { email, passcode, time });
    } catch (error) {
      throw new Error(error.text || error.message);
    }
  }
}
