import Editor from "@monaco-editor/react";
import { Clipboard, FileDown, Send } from "lucide-react";

type Props = {
  code: string;
  onInsert: () => void;
};

export function ArchitectureCodeGenerator({ code, onInsert }: Props) {
  function exportCode() {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "generated_architecture.py";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel code-generator">
      <div className="panel-title">
        <h2>Generated PyTorch Code</h2>
        <div className="toolbar">
          <button onClick={() => navigator.clipboard.writeText(code)}>
            <Clipboard size={15} aria-hidden="true" />
            Copy
          </button>
          <button onClick={exportCode}>
            <FileDown size={15} aria-hidden="true" />
            Export
          </button>
          <button className="primary-button" onClick={onInsert}>
            <Send size={15} aria-hidden="true" />
            Insert into Notebook
          </button>
        </div>
      </div>
      <Editor
        height={420}
        defaultLanguage="python"
        theme="vs-dark"
        value={code}
        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
      />
    </section>
  );
}
