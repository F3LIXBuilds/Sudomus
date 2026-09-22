const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Strip trailing slashes and trailing /api so `${config.API_URL}/api/...` doesn't produce /api/api/...
const BASE_URL = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');

const config = {
  API_URL: BASE_URL,
};

export default config;
