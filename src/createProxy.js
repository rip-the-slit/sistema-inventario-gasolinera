export function checkRoles(roles) {
  return (userRole) => roles.includes(userRole);
}

async function checkPermissions(target, prop, authService) {
  if (typeof prop !== "string" || prop === "getPermissions") {
    return { result: true, message: "" };
  }

  const userRole = (await authService?.getCurrentUser())?.role ?? null;
  const permissions = target.getPermissions();
  const allowedRoles = permissions[prop];
  const result = Array.isArray(allowedRoles) && checkRoles(allowedRoles)(userRole);

  return {
    result,
    message: `Access denied for role ${userRole} on ${prop}.`,
  };
}

export function createProxy(initialState, authService) {
  const listeners = new Set();

  const notify = (target) => listeners.forEach((listener) => listener(target));

  const handler = {
    get(target, prop) {
      if (!(prop in target) || (typeof prop === "string" && prop.startsWith("_"))) {
        throw new Error("Propiedad no válida.");
      }

      const value = target[prop];
      if (typeof value !== "function") return value;

      if (prop === "getPermissions") return value.bind(target);

      return async (...args) => {
        const permission = await checkPermissions(target, prop, authService);
        if (!permission.result) throw new Error(permission.message);
        const result = await value.apply(target, args);
        notify(target);
        return result;
      };
    },
  };

  const state = new Proxy(initialState, handler);

  function subscribe(callback) {
    listeners.add(callback);
    callback(state);
    return () => listeners.delete(callback);
  }

  return { state, subscribe };
}
