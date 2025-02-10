(function() {
  // Create widget container
  const container = document.createElement('div');
  container.id = 'fastbots-widget-container';
  document.body.appendChild(container);

  // Load React and ReactDOM
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Load styles
  const loadStyles = () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap';
    document.head.appendChild(link);
  };

  const init = async () => {
    try {
      // Load dependencies
      await Promise.all([
        loadScript('https://unpkg.com/react@17/umd/react.production.min.js'),
        loadScript('https://unpkg.com/react-dom@17/umd/react-dom.production.min.js'),
      ]);

      loadStyles();

      // Load widget bundle
      const config = window.FastBotsConfig || {};
      const widgetUrl = new URL('/widget-bundle.js', document.currentScript.src);
      await loadScript(widgetUrl.href);

      // Initialize widget
      window.FastBotsWidget.init(container, config);
    } catch (error) {
      console.error('Failed to load FastBots widget:', error);
    }
  };

  init();
})();
