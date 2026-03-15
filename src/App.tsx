import { useState } from "react";
import { projects } from "./lib/mockData";
import Sidebar from "./components/sidebar/Sidebar";
import ConversationView from "./components/conversation/ConversationView";
import OutputPanel from "./components/output/OutputPanel";

function App() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const selectedConversation = projects
  .flatMap(project => project.conversations)
  .find(convo => convo.id === selectedConversationId);

  // console.log(selectedConversationId);

  return(
    <>
      <div className="flex h-full bg-surface-base">
        <div className="w-[240px] bg-surface-raised border-r border-surface-border flex flex-col">
          <Sidebar projects={projects} selectedConversationId={selectedConversationId} onSelectConversation={setSelectedConversationId}/>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationView conversation={selectedConversation ?? null}/>
        </div>
        <div className="w-[320px] bg-surface-raised border-l border-surface-border">
          <OutputPanel conversation={selectedConversation ?? null}/>
        </div>
      </div>
    </>
  )
}



export default App;
