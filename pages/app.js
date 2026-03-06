const runtimeEl = document.querySelector('#runtime');

if (window.appInfo) {
  runtimeEl.textContent = `Running in Electron: ${window.appInfo.name} v${window.appInfo.version}`;
} else {
  runtimeEl.textContent = 'Running in web mode (GitHub Pages compatible).';
}
