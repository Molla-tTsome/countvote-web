import InputPanel from './components/InputPanel'
import ResultView from './components/ResultView'
import { useElectionStore } from './useElectionStore'
import './App.css'

function App() {
  const store = useElectionStore()

  return (
    <div className="app-layout">
      <section className="screen-block">
        <h2 className="screen-label">용자가 보는 화면</h2>
        <div className="result-area">
          <ResultView snapshot={store.snapshot} revealStage={store.revealStage} />
        </div>
      </section>

      <section className="screen-block screen-block--input">
        <h2 className="screen-label">영자가 조작하는 화면</h2>
        <InputPanel store={store} />
      </section>
    </div>
  )
}

export default App
