if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', document.currentScript.src);

    navigator.serviceWorker
      .register(swUrl.href)
      .catch(() => {
        /* 本地 file:// 或未使用 HTTP 伺服器時略過 */
      });
  });
}
