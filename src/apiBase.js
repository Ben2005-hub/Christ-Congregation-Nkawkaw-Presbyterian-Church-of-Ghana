// Returns the API base URL used by the frontend. Uses an optional override stored in localStorage
export function getApiBase() {
  try {
    const override = localStorage.getItem('api_base_override');
    if (override && override.trim()) return override.trim();
    const loc = window.location;
    return `${loc.protocol}//${loc.hostname}:5001`;
  } catch (e) {
    return 'http://localhost:5001';
  }
}

export default getApiBase;
