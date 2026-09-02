export function checkRoles(roles) {
  return (userRole) => {
    return roles.includes(userRole);
  }
}

function checkPermissions(target, prop, authService) {
  const userRole = authService?.getCurrentUser()?.role;
  const permissions = target?.getPermissions();

  const result = checkRoles(permissions[prop])(userRole);

  return {
    result,
    message: `Acceso ${result ? "permitido" : "denegado"} para el rol ${userRole} en ${target}["${prop}"]`,
  };
}

export function createProxy(initialState, authService) {
  const listeners = new Set();

  const handler = {
    set(target, prop, value) {
      const permission = checkPermissions(target, prop, authService);
      if (!permission.result) throw new Error(permission.message);

      target[prop] = value;
      listeners.forEach((listener) => listener(target));
      return true;
    },

    get(target, prop, receiver) {
      const permission = checkPermissions(target, prop, AuthService);
      if (!permission.result) throw new Error(permission.message);

      if (prop in target && prop[0] !== "_") {
        if (typeof target[prop] === "function") {
          listeners.forEach((listener) => listener(target));
          return target[prop].bind(target);
        } else {
          return target[prop];
        }
      } else {
        throw new Error("problem");
      }
    },
  };

  const state = new Proxy({ ...initialState }, handler);

  function subscribe(callback) {
    listeners.add(callback);
    callback(state);
    return () => listeners.delete(callback);
  }

  return { state, subscribe };
}
