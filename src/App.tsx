import { useState } from "react";
import { projects } from "./lib/mockData";

function App() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const selectedConversation = projects
  .flatMap(project => project.conversations)
  .find(convo => convo.id === selectedConversationId);

  return(
    <>
      <div className="flex h-full">
        <div className="w-[240px]">
          <p>Sidebar</p>
        </div>
        <div className="flex-1">
          <p>Convo view</p>
        </div>
        <div className="w-[320px]">
          <p>Output panel</p>
        </div>
      </div>
    </>
  )
}



export default App;
