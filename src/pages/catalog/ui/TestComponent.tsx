import React, { useState } from "react";

/* function heavyCalculation(): number {
  const start = performance.now();

  while (performance.now() - start < 5000) {
    // Имитируем тяжёлое вычисление
  }

  return 42;
} */

export const TestComponent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  console.log("TestComponent render");
  const handleClick = () => {
    setLoading(true);

    console.log("import.meta", import.meta);
    const worker = new Worker(new URL("./heavy.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event) => {
      setResult(event.data);
      setLoading(false);

      worker.terminate();
    };

    worker.postMessage(null);
  };

  return (
    <div className="catalog:flex catalog:flex-col catalog:gap-4">
      <button
        onClick={handleClick}
        className="catalog:cursor-pointer catalog:px-4 catalog:bg-amber-500 catalog:hover:bg-amber-600 "
      >
        Начать расчёт
      </button>

      <button onClick={() => setResult(null)} className="catalog:cursor-pointer">
        Начать расчёт
      </button>

      {loading && <p>Вычисляем...</p>}
      {result !== null && <p>Результат: {result}</p>}
    </div>
  );
};
