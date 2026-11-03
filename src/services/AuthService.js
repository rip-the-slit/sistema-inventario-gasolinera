import Service from "./Service.js";

export class User {
  constructor(id, email, password, role, fullName = null) {
    Object.assign(this, { id, email, password, role, fullName });
  }
}

export default class AuthService extends Service {
  constructor() {
    super({
      register: ["admin"], login: [null, "employee", "admin"],
      logout: [null, "employee", "admin"], getCurrentUser: [null, "employee", "admin"],
      getUsers: ["admin"], editUser: ["admin"], deleteUser: ["admin"],
      generateOTP: ["admin"], validateOTP: ["admin"],
    });
  }

  register(user) { return this.request("AuthService", "register", user, "POST"); }
  login(credentials = {}) { return this.request("AuthService", "login", credentials, "POST"); }
  logout() { return this.request("AuthService", "logout", {}, "POST"); }
  getCurrentUser() { return this.request("AuthService", "getCurrentUser"); }
  getUsers() { return this.request("AuthService", "getUsers"); }
  editUser(user) { return this.request("AuthService", "editUser", user, "POST"); }
  deleteUser(id) { return this.request("AuthService", "deleteUser", { id }, "POST"); }
  generateOTP(email) { return this.request("AuthService", "generateOTP", { email }, "POST"); }
  validateOTP(otp, email) { return this.request("AuthService", "validateOTP", { otp, email }, "POST"); }
}
