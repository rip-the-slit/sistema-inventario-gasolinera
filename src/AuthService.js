class User {
  constructor(id, name, role) {
    this.id = id;
    this.name = name;
    if (["employee", "admin"].includes(role)) this.role = role;
  }
}

export default class AuthService {
  #permissions = {
    "register": ["admin"],
    "login": [null],
    "getCurrentUser": [null]
  }
  #current = null;
  #users = []

  constructor() {}

  register() {

  }

  login() {
    
  }
  
  getCurrentUser() {
    return this.#current;
  }
}