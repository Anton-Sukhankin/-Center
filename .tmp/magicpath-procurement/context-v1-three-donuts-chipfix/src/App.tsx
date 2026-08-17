import { Theme } from './settings/types';
import { ProcurementMetrics03ThreeCircularCards } from './components/generated/ProcurementMetrics03ThreeCircularCards';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return (
    <>
      <ProcurementMetrics03ThreeCircularCards />
    </>);
  // %EXPORT_STATEMENT%
}

export default App;