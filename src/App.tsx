import { useState } from "react";
import { projects } from "./lib/mockData";
import Sidebar from "./components/sidebar/Sidebar";
import ConversationView from "./components/conversation/ConversationView";

function App() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const selectedConversation = projects
  .flatMap(project => project.conversations)
  .find(convo => convo.id === selectedConversationId);

  // console.log(selectedConversationId);

  return(
    <>
      <div className="flex h-full">
        <div className="w-[240px]">
          <Sidebar projects={projects} selectedConversationId={selectedConversationId} onSelectConversation={setSelectedConversationId}/>
        </div>
        <div className="flex-1">
          <p>Convo view</p>
          <ConversationView conversation={selectedConversation ?? null}/>
        </div>
        <div className="w-[320px]">
          <p>Output panel</p>
        </div>
      </div>
    </>
  )
}



export default App;
