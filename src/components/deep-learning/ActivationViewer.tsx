export function ActivationViewer() {
  return (
    <section className="panel">
      <h2>Neural Network Internals Viewer</h2>
      <div className="internals-grid">
        <div>
          <strong>Weights as heatmaps</strong>
          <span>Available after PyTorch training through the weights viewer.</span>
        </div>
        <div>
          <strong>Bias bar charts</strong>
          <span>Uses named parameters from selected torch.nn.Module variables.</span>
        </div>
        <div>
          <strong>Neuron activations</strong>
          <span>Forward-hook capture placeholder for the next MVP increment.</span>
        </div>
        <div>
          <strong>Dead ReLU neurons</strong>
          <span>Planned from activation sparsity statistics.</span>
        </div>
        <div>
          <strong>Gradient magnitudes</strong>
          <span>Planned from backward hooks during training.</span>
        </div>
        <div>
          <strong>Layer output shapes</strong>
          <span>Model summary endpoint is ready for PyTorch modules.</span>
        </div>
        <div>
          <strong>Convolution filters</strong>
          <span>Placeholder for image models.</span>
        </div>
        <div>
          <strong>Grad-CAM</strong>
          <span>Future image-model interpretability view.</span>
        </div>
      </div>
    </section>
  );
}
