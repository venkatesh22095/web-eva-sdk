import React, { useEffect } from 'react';
import { HistoryWidget, PossibilitiesWidget } from './widgets';
import ChatTestComp from './test-comp/ChatTestComp';
import File from './test-comp/File';
import Agents from './test-comp/agents';
import SelectedContext from './test-comp/selectedContext';
import TestComp from "./test-comp/testComp";
import ChatInterfaceDemo from './test-comp/ChatInterfaceDemo/ChatInterface';
import { renderParentComponent } from './master-component/ParentComponent';


const App = () => {

  useEffect(() => {
    fetchHistoryWidgetData()
    fetchPossiblitiesWidgetData()
    renderParentComponent('master-component')
  }, [])

  const fetchHistoryWidgetData = async () => {
    const res = await HistoryWidget({limit: 3, unsorted: true})    
  }
  const fetchPossiblitiesWidgetData = async () => {
    const res = await PossibilitiesWidget()    
  }

  
  
  return (
    <div className='app-container'>
      <div id='master-component' className='master-component'></div> 
      {/* <ChatInterfaceDemo /> */}
      {/* <ChatTestComp/> */}
      {/* <TestComp /> */}
      {/* <Agents /> */}
      {/* <File /> */}
      {/* <SelectedContext/> */}
    </div>
  )
}

export default App;
