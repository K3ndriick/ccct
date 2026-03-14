import { useState } from "react";
import type { Conversation } from "../../types";

interface OutputPanelProps {
  conversation: Conversation | null
}

export default function OutputPanel({ conversation } : OutputPanelProps) {
  const fakeString = "FAKE STRING FOR NOW";
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  return(
    <div>
      <button disabled={!conversation} onClick={() => setGeneratedPrompt(fakeString)}>
        Generate Prompt
      </button>
      {generatedPrompt && <pre>{generatedPrompt}</pre>}
    </div>
  )
}