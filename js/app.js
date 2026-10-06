import { getAppStatus } from './services/app-service.js';
import { initializeApp } from './core/bootstrap.js';

const appStatus = getAppStatus();

if (appStatus.ready) {
  initializeApp();
}

console.log(`${appStatus.name} status: ${appStatus.phase}.`);