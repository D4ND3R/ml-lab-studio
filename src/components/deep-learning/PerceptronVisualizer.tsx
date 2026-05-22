import { useMemo, useState } from "react";

const activations = ["Step", "Sigmoid", "Tanh", "ReLU", "Leaky ReLU", "Softmax"] as const;

function applyActivation(name: (typeof activations)[number], z: number): number {
  if (name === "Step") {
    return z >= 0 ? 1 : 0;
  }
  if (name === "Sigmoid") {
    return 1 / (1 + Math.exp(-z));
  }
  if (name === "Tanh") {
    return Math.tanh(z);
  }
  if (name === "ReLU") {
    return Math.max(0, z);
  }
  if (name === "Leaky ReLU") {
    return z >= 0 ? z : 0.01 * z;
  }
  return 1;
}

export function PerceptronVisualizer() {
  const [inputs, setInputs] = useState([0.8, 0.4, 0.2]);
  const [weights, setWeights] = useState([1.2, -0.8, 0.5]);
  const [bias, setBias] = useState(-0.2);
  const [activation, setActivation] = useState<(typeof activations)[number]>("Sigmoid");
  const z = useMemo(() => inputs.reduce((sum, input, index) => sum + input * weights[index], bias), [bias, inputs, weights]);
  const output = applyActivation(activation, z);
  const boundaryY1 = weights[1] === 0 ? 0 : -(weights[0] * -1 + bias) / weights[1];
  const boundaryY2 = weights[1] === 0 ? 0 : -(weights[0] * 1 + bias) / weights[1];

  return (
    <div className="perceptron-grid">
      <section className="panel">
        <h2>Perceptron Visualizer</h2>
        <div className="slider-stack">
          {inputs.map((input, index) => (
            <label key={`input-${index}`}>
              x{index + 1}: {input.toFixed(2)}
              <input
                type="range"
                min={-2}
                max={2}
                step={0.05}
                value={input}
                onChange={(event) => setInputs((current) => current.map((value, itemIndex) => (itemIndex === index ? Number(event.target.value) : value)))}
              />
            </label>
          ))}
          {weights.map((weight, index) => (
            <label key={`weight-${index}`}>
              w{index + 1}: {weight.toFixed(2)}
              <input
                type="range"
                min={-3}
                max={3}
                step={0.05}
                value={weight}
                onChange={(event) => setWeights((current) => current.map((value, itemIndex) => (itemIndex === index ? Number(event.target.value) : value)))}
              />
            </label>
          ))}
          <label>
            bias: {bias.toFixed(2)}
            <input type="range" min={-3} max={3} step={0.05} value={bias} onChange={(event) => setBias(Number(event.target.value))} />
          </label>
          <label>
            Activation
            <select value={activation} onChange={(event) => setActivation(event.target.value as (typeof activations)[number])}>
              {activations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="panel perceptron-display">
        <div className="formula">
          z = {weights.map((weight, index) => `${weight.toFixed(2)}x${index + 1}`).join(" + ")} + {bias.toFixed(2)}
        </div>
        <div className="metric-grid wide">
          <div>
            <dt>Weighted sum</dt>
            <dd>{z.toFixed(4)}</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd>{output.toFixed(4)}</dd>
          </div>
        </div>
        <svg className="perceptron-svg" viewBox="0 0 520 320" role="img" aria-label="Perceptron decision boundary">
          <line x1="40" y1="160" x2="480" y2="160" className="axis-line" />
          <line x1="260" y1="24" x2="260" y2="296" className="axis-line" />
          <line
            x1="40"
            y1={160 - boundaryY1 * 80}
            x2="480"
            y2={160 - boundaryY2 * 80}
            className="boundary-line"
          />
          <circle cx={260 + inputs[0] * 80} cy={160 - inputs[1] * 80} r="8" className={z >= 0 ? "point positive" : "point negative"} />
          <text x="34" y="24" className="svg-label">2D boundary from x1, x2</text>
        </svg>
      </section>
    </div>
  );
}
