// Capacitor Runtime & Bridge Initializer
(function() {
  if (typeof window === 'undefined') return;
  
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isCapacitorScheme = (
    window.location.protocol === 'capacitor:' ||
    window.location.hostname === 'localhost' ||
    window.location.origin.includes('localhost')
  );

  // Preserve existing Capacitor instance if already initialized by native bridge
  if (!window.Capacitor) {
    window.Capacitor = {
      isNativePlatform: function() {
        return !!(window.androidBridge || (isAndroid && isCapacitorScheme));
      },
      isPluginAvailable: function(name) {
        return !!(window.Capacitor?.Plugins && window.Capacitor.Plugins[name]);
      },
      getPlatform: function() {
        return (isAndroid ? 'android' : 'web');
      },
      Plugins: {}
    };
  } else {
    // If Capacitor exists, ensure helper methods are valid
    if (typeof window.Capacitor.isNativePlatform !== 'function') {
      window.Capacitor.isNativePlatform = function() {
        return true;
      };
    }
    if (!window.Capacitor.Plugins) {
      window.Capacitor.Plugins = {};
    }
  }
})();
