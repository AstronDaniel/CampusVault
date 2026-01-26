import Reactotron from 'reactotron-react-native';

// Store original console methods before overriding
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleDebug = console.debug;
const originalConsoleInfo = console.info;

// Safe initialization wrapper to avoid EventEmitter errors in RN 0.80+
const initReactotron = () => {
  try {
    Reactotron.configure({
      name: 'CampusVault',
    })
      .useReactNative({
        asyncStorage: false,
        networking: {
          ignoreUrls: /symbolicate|generate_204/,
        },
        errors: { veto: () => false }, // Show all errors
        editor: false,
        overlay: false,
      })
      .connect();

    // Override console methods to send to Reactotron
    // This ensures all console output appears in Reactotron

    console.log = (...args: any[]) => {
      originalConsoleLog.apply(console, args);
      try {
        Reactotron.log?.(...args);
      } catch (e) {
        // Silently fail if Reactotron not ready
      }
    };

    console.warn = (...args: any[]) => {
      originalConsoleWarn.apply(console, args);
      try {
        Reactotron.warn?.(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      } catch (e) {
        // Silently fail if Reactotron not ready
      }
    };

    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      try {
        Reactotron.error?.(args.map(arg => {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
          }
          return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
        }).join(' '), null);
      } catch (e) {
        // Silently fail if Reactotron not ready
      }
    };

    console.debug = (...args: any[]) => {
      originalConsoleDebug.apply(console, args);
      try {
        Reactotron.debug?.(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      } catch (e) {
        // Silently fail if Reactotron not ready
      }
    };

    console.info = (...args: any[]) => {
      originalConsoleInfo.apply(console, args);
      try {
        Reactotron.log?.(...args);
      } catch (e) {
        // Silently fail if Reactotron not ready
      }
    };

    // Also capture unhandled promise rejections
    const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
    global.ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
      try {
        Reactotron.error?.(`🔴 ${isFatal ? 'FATAL' : 'ERROR'}: ${error?.message || error}`, error?.stack || null);
      } catch (e) {
        // Silently fail
      }
      originalHandler?.(error, isFatal);
    });

    // Log that Reactotron is ready
    Reactotron.log?.('✅ Reactotron connected and capturing all console output');

  } catch (error) {
    originalConsoleWarn('[Reactotron] Failed to initialize:', error);
  }
};

initReactotron();

// Extend console with Reactotron log
declare global {
  interface Console {
    tron: typeof Reactotron;
  }
  var ErrorUtils: {
    getGlobalHandler: () => ((error: any, isFatal: boolean) => void) | undefined;
    setGlobalHandler: (handler: (error: any, isFatal: boolean) => void) => void;
  };
};

console.tron = Reactotron;

export default Reactotron;
