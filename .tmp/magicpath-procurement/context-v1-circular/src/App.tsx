import { Theme } from './settings/types';
import { ProcurementMetrics02CircularContracting } from './components/generated/ProcurementMetrics02CircularContracting';

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
      <ProcurementMetrics02CircularContracting />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
