self.onmessage = (event) => {
  const start = performance.now();

  while (performance.now() - start < 5000) {
    // Имитируем тяжёлое вычисление
  }
  self.postMessage(42);
};
