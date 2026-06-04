import './style.css';
import packageJson from '../../package.json';

const PLUGIN_NAME = 'MessageInputBot';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="popup">
    <h1 class="name">${PLUGIN_NAME}</h1>
    <p class="version">v${packageJson.version}</p>
  </div>
`;
