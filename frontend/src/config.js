function getConfig(name, defaultValue = null) {
  // If inside a docker container, use window.ENV
  if (window.ENV !== undefined) {
    return window.ENV[name] || defaultValue;
  }

  return import.meta.env[name] || defaultValue;
}

export function getBackendUrl() {
  const url = getConfig("VITE_BACKEND_URL", "https://api.zapprofit.com.br/");
  if (!url) return "https://api.zapprofit.com.br/";
  return url.endsWith("/") ? url : `${url}/`;
}

export function getHoursCloseTicketsAuto() {
  return getConfig("VITE_HOURS_CLOSE_TICKETS_AUTO");
}
