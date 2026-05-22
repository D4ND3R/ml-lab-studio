import { AlertTriangle, CheckCircle2, ClipboardPlus, Lightbulb } from "lucide-react";

import type { AssistantSuggestion } from "../../lib/assistant";

type Props = {
  suggestions: AssistantSuggestion[];
  onInsertCode?: (code: string) => void;
};

function iconFor(severity: AssistantSuggestion["severity"]) {
  if (severity === "warning") {
    return AlertTriangle;
  }
  if (severity === "success") {
    return CheckCircle2;
  }
  return Lightbulb;
}

export function MLAssistantPanel({ suggestions, onInsertCode }: Props) {
  return (
    <div className="assistant-panel">
      {suggestions.map((suggestion) => {
        const Icon = iconFor(suggestion.severity);
        return (
          <article key={`${suggestion.title}-${suggestion.detail}`} className={`assistant-card ${suggestion.severity}`}>
            <Icon size={18} aria-hidden="true" />
            <div>
              <strong>{suggestion.title}</strong>
              <p>{suggestion.detail}</p>
              {suggestion.code && onInsertCode ? (
                <button onClick={() => onInsertCode(suggestion.code ?? "")}>
                  <ClipboardPlus size={14} aria-hidden="true" />
                  Insert code
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
