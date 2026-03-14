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
      <div className="flex h-full">
        <div className="w-[240px]">
          <Sidebar projects={projects} selectedConversationId={selectedConversationId} onSelectConversation={setSelectedConversationId}/>
        </div>
        <div className="flex-1">
          <ConversationView conversation={selectedConversation ?? null}/>
        </div>
        <div className="w-[320px]">
          <OutputPanel conversation={selectedConversation ?? null}/>
        </div>
      </div>
    </>
  )
}



export default App;
