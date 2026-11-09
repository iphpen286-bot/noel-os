import { Routes, Route } from 'react-router-dom'
import { useStore } from './store/store'
import TabBar from './components/TabBar'
import Dashboard from './screens/Dashboard'
import Training from './screens/Training'
import Nutrition from './screens/Nutrition'
import Mail from './screens/Mail'
import Coach from './screens/Coach'
import Tasks from './screens/Tasks'
import Progress from './screens/Progress'
import Onboarding from './screens/Onboarding'

export default function App() {
  const onboarded = useStore((s) => s.profile.onboarded)

  if (!onboarded) {
    return (
      <div className="app">
        <Onboarding />
      </div>
    )
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/aufgaben" element={<Tasks />} />
        <Route path="/training" element={<Training />} />
        <Route path="/essen" element={<Nutrition />} />
        <Route path="/fortschritt" element={<Progress />} />
        <Route path="/mail" element={<Mail />} />
        <Route path="/coach" element={<Coach />} />
      </Routes>
      <TabBar />
    </div>
  )
}
