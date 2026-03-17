
import { loadState } from './appState.js';
import { renderFormPage } from './pages/formPage.js';
import { renderResultPage } from './pages/resultPage.js';

const app = document.getElementById('app');
loadState();

function render() {
  const hash = window.location.hash || '#form';
  if (hash === '#result') {
    renderResultPage(app, render);
  } else {
    renderFormPage(app, render);
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('load', render);
render();
