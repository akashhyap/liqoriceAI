// Suppress ResizeObserver error messages
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('ResizeObserver loop')) {
    return;
  }
  originalError.apply(console, args);
};

export const initErrorHandler = () => {
  // Add any additional error handling initialization here
};
