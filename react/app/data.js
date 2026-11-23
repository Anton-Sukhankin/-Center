// Порядок соответствует зависимостям общих демонстрационных наборов.
import '../../src/data/app-data.js';
import '../../src/data/procurement-metrics-data.js';
import '../../src/data/metrics-dashboard-data.js';
import '../../src/data/task-data.js';
import '../../src/data/project-structure.js';
import '../../src/data/construction-objects-data.js';
import '../../src/data/objects-data.js';
import '../../src/data/digital-chessboard-summary-data.js';

export const data = Object.freeze({
    appData: window.appData,
    projectStructureData: window.projectStructureData,
    taskData: window.taskData,
    metricsDashboardData: window.metricsDashboardData,
    constructionObjectsData: window.constructionObjectsData,
    objectsData: window.objectsData,
    digitalChessboardSummaryData: window.digitalChessboardSummaryData
});
