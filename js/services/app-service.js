import { APP_CONFIG } from '../config/app-config.js';

export function getAppStatus() {
  return {
    name: APP_CONFIG.name,
    phase: APP_CONFIG.phase,
    ready: true
  };
}
