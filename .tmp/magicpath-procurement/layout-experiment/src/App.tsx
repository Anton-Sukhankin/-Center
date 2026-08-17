import { Theme } from './settings/types';
import { ProcurementMetrics04SplitAnalyticsLayout } from './components/generated/ProcurementMetrics04SplitAnalyticsLayout';

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
      <ProcurementMetrics04SplitAnalyticsLayout />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
