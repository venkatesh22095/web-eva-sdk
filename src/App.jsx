import React, { useEffect } from 'react';
import { HistoryWidget, PossibilitiesWidget } from './widgets';
import ChatTestComp from './test-comp/ChatTestComp';
import File from './test-comp/File';
import Agents from './test-comp/agents';
import SelectedContext from './test-comp/selectedContext';
import TestComp from "./test-comp/testComp";
import ChatInterfaceDemo from './test-comp/ChatInterfaceDemo/ChatInterface';


const App = () => {

  useEffect(() => {
    fetchHistoryWidgetData()
    fetchPossiblitiesWidgetData()
  }, [])

  const fetchHistoryWidgetData = async () => {
    const res = await HistoryWidget({limit: 3, unsorted: true})    
  }
  const fetchPossiblitiesWidgetData = async () => {
    const res = await PossibilitiesWidget()    
  }
  
  return (
    <div>
      <ChatInterfaceDemo />
      {/* <ChatTestComp/> */}
      {/* <TestComp /> */}
      {/* <Agents /> */}
      {/* <File /> */}
      {/* <SelectedContext/> */}
    </div>
  )
}

export default App;
