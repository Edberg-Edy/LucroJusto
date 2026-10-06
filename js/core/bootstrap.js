import { APP_CONFIG } from '../config/app-config.js';
import { renderText } from '../modules/renderer.js';

export function initializeApp() {
  renderText('[data-app-name]', APP_CONFIG.name);
  renderText('[data-app-phase]', APP_CONFIG.phase);
  renderText('[data-app-description]', APP_CONFIG.description);

  console.log(`${APP_CONFIG.name} inicializado. ${APP_CONFIG.phase}.`);
}
