// Единый источник структуры бизнес-юнитов, проектов и очередей.
// Файл подключается обычным <script> до src/app/app.js.
(function (window) {
    const projectStructure = [
        {
            id: 'bu-1',
            name: 'БИЗНЕС-ЮНИТ «САМОЛЕТ ОБРАЗОВАНИЕ»',
            type: 'bu',
            isExpanded: false,
            headerAttributes: { stage: 'Портфель', businessUnit: 'САМОЛЕТ ОБРАЗОВАНИЕ', cluster: 'N/A', region: 'N/A', manager: 'Центральный офис' },
            children: []
        },
        {
            id: 'bu-2',
            name: 'БИЗНЕС-ЮНИТ МОСКВА',
            type: 'bu',
            isExpanded: true,
            headerAttributes: { stage: 'Портфель', businessUnit: 'МОСКВА', cluster: 'Премиум / Комфорт', region: 'Москва', manager: 'Центральный офис' },
            children: [
                {
                    id: 'proj-nova',
                    name: 'Nova',
                    type: 'project',
                    isExpanded: true,
                    headerAttributes: { stage: 'Реализация', businessUnit: 'МОСКВА', cluster: 'Премиум', region: 'Москва', manager: 'Иванов И.И.' },
                    children: [
                        { id: 'q-n-1', name: 'Очередь 1', type: 'queue' },
                        { id: 'q-n-2', name: 'Очередь 2', type: 'queue' },
                        { id: 'q-n-3', name: 'Очередь 3', type: 'queue' },
                        { id: 'q-n-4', name: 'Очередь 4', type: 'queue' },
                        { id: 'q-n-5', name: 'Очередь 5', type: 'queue' }
                    ]
                },
                {
                    id: 'proj-alkhimovo',
                    name: 'Алхимово',
                    type: 'project',
                    headerAttributes: { stage: 'Реализация', businessUnit: 'МОСКВА', cluster: 'Комфорт', region: 'Москва', manager: 'Иванов И.И.' },
                    children: [
                        { id: 'q-a-1', name: 'Очередь 1', type: 'queue' },
                        { id: 'q-a-2', name: 'Очередь 2', type: 'queue' },
                        { id: 'q-a-3', name: 'Очередь 3', type: 'queue' },
                        { id: 'q-a-4', name: 'Очередь 4', type: 'queue' },
                        { id: 'q-a-5', name: 'Очередь 5', type: 'queue' }
                    ]
                },
                {
                    id: 'proj-malzhenninovo',
                    name: 'Малженниново',
                    type: 'project',
                    headerAttributes: { stage: 'Проектирование', businessUnit: 'МОСКОВСКИЙ УРБАН', cluster: 'Комфорт', region: 'Москва', manager: 'Петров А.В.' },
                    children: [
                        { id: 'q-m-1', name: 'Очередь 1', type: 'queue' },
                        { id: 'q-m-2', name: 'Очередь 2', type: 'queue' },
                        { id: 'q-m-3', name: 'Очередь 3', type: 'queue' },
                        { id: 'q-m-4', name: 'Очередь 4', type: 'queue' },
                        { id: 'q-m-5', name: 'Очередь 5', type: 'queue' }
                    ]
                },
                {
                    id: 'proj-novy-kvartal',
                    name: 'Новый квартал',
                    type: 'project',
                    headerAttributes: { stage: 'Проектирование', businessUnit: 'МОСКОВСКИЙ УРБАН', cluster: 'Комфорт', region: 'Москва', manager: 'Петров А.В.' },
                    children: [
                        { id: 'q-nk-1', name: 'Очередь 1', type: 'queue' },
                        { id: 'q-nk-2', name: 'Очередь 2', type: 'queue' },
                        { id: 'q-nk-3', name: 'Очередь 3', type: 'queue' },
                        { id: 'q-nk-4', name: 'Очередь 4', type: 'queue' },
                        { id: 'q-nk-5', name: 'Очередь 5', type: 'queue' }
                    ]
                },
                {
                    id: 'proj-kolskie-ogni',
                    name: 'Кольские огни',
                    type: 'project',
                    headerAttributes: { stage: 'Проектирование', businessUnit: 'МОСКОВСКИЙ УРБАН', cluster: 'Комфорт', region: 'Москва', manager: 'Петров А.В.' },
                    children: [
                        { id: 'q-ko-1', name: 'Очередь 1', type: 'queue' },
                        { id: 'q-ko-2', name: 'Очередь 2', type: 'queue' },
                        { id: 'q-ko-3', name: 'Очередь 3', type: 'queue' },
                        { id: 'q-ko-4', name: 'Очередь 4', type: 'queue' },
                        { id: 'q-ko-5', name: 'Очередь 5', type: 'queue' }
                    ]
                },
                {
                    id: 'proj-dmitrov-dom',
                    name: 'Дмитров дом',
                    type: 'project',
                    headerAttributes: { stage: 'Проектирование', businessUnit: 'МОСКОВСКИЙ УРБАН', cluster: 'Комфорт', region: 'Москва', manager: 'Петров А.В.' },
                    children: [
                        { id: 'q-dd-1', name: 'Очередь 1', type: 'queue' },
                        { id: 'q-dd-2', name: 'Очередь 2', type: 'queue' },
                        { id: 'q-dd-3', name: 'Очередь 3', type: 'queue' },
                        { id: 'q-dd-4', name: 'Очередь 4', type: 'queue' },
                        { id: 'q-dd-5', name: 'Очередь 5', type: 'queue' }
                    ]
                },
                {
                    id: 'proj-tsvetochny',
                    name: 'Цветочный',
                    type: 'project',
                    headerAttributes: { stage: 'Проектирование', businessUnit: 'МОСКОВСКИЙ УРБАН', cluster: 'Комфорт', region: 'Москва', manager: 'Петров А.В.' },
                    children: [
                        { id: 'q-ts-1', name: 'Очередь 1', type: 'queue' },
                        { id: 'q-ts-2', name: 'Очередь 2', type: 'queue' },
                        { id: 'q-ts-3', name: 'Очередь 3', type: 'queue' },
                        { id: 'q-ts-4', name: 'Очередь 4', type: 'queue' },
                        { id: 'q-ts-5', name: 'Очередь 5', type: 'queue' }
                    ]
                }
            ]
        },
        {
            id: 'bu-3',
            name: 'БИЗНЕС-ЮНИТ «ДОМ»',
            type: 'bu',
            isExpanded: false,
            headerAttributes: { stage: 'Портфель', businessUnit: 'ДОМ', cluster: 'Комфорт', region: 'Москва', manager: 'Центральный офис' },
            children: [
                {
                    id: 'proj-putilkovo',
                    name: 'БОЛЬШОЕ ПУТИЛКОВО',
                    type: 'project',
                    isExpanded: false,
                    headerAttributes: { stage: 'Проектирование', businessUnit: 'ДОМ', cluster: 'Комфорт', region: 'Москва', manager: 'Петров А.В.' },
                    children: [
                        { id: 'q-p-1', name: 'Очередь 1', type: 'queue' },
                        { id: 'q-p-2', name: 'Очередь 2', type: 'queue' },
                        { id: 'q-p-3', name: 'Очередь 3', type: 'queue' },
                        { id: 'q-p-4', name: 'Очередь 4', type: 'queue' }
                    ]
                }
            ]
        },
        {
            id: 'bu-4',
            name: 'БИЗНЕС-ЮНИТ «САМОЛЕТ БАНК»',
            type: 'bu',
            isExpanded: false,
            headerAttributes: { stage: 'Портфель', businessUnit: 'САМОЛЕТ БАНК', cluster: 'N/A', region: 'N/A', manager: 'Центральный офис' },
            children: []
        },
        {
            id: 'bu-5',
            name: 'БИЗНЕС-ЮНИТ «САМОЛЕТ ПЛЮС»',
            type: 'bu',
            isExpanded: false,
            headerAttributes: { stage: 'Портфель', businessUnit: 'САМОЛЕТ ПЛЮС', cluster: 'N/A', region: 'N/A', manager: 'Центральный офис' },
            children: []
        },
        {
            id: 'bu-6',
            name: 'БИЗНЕС-ЮНИТ «ГОСТЕПРИИМСТВО»',
            type: 'bu',
            isExpanded: false,
            headerAttributes: { stage: 'Портфель', businessUnit: 'ГОСТЕПРИИМСТВО', cluster: 'N/A', region: 'N/A', manager: 'Центральный офис' },
            children: []
        }
    ];

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getProjectStructure() {
        return clone(projectStructure);
    }

    function walk(nodes, callback, parentProject, parentBusinessUnit) {
        for (const node of nodes) {
            const nextBusinessUnit = node.type === 'bu' ? node : parentBusinessUnit;
            const nextProject = node.type === 'project' ? node : parentProject;
            callback(node, nextProject, nextBusinessUnit);
            if (node.children) {
                walk(node.children, callback, nextProject, nextBusinessUnit);
            }
        }
    }

    function findProjectEntityById(id, nodes) {
        let result = null;
        walk(nodes || projectStructure, (node, parentProject, parentBusinessUnit) => {
            if (node.id === id) {
                result = {
                    ...node,
                    parentProjectId: parentProject ? parentProject.id : null,
                    parentBusinessUnitId: parentBusinessUnit ? parentBusinessUnit.id : null
                };
            }
        });
        return result;
    }

    function collectScopeFromNode(node, parentProject, parentBusinessUnit) {
        const projectIds = [];
        const queueIds = [];
        const businessUnitIds = [];

        if (node.type === 'bu') {
            businessUnitIds.push(node.id);
        } else if (parentBusinessUnit) {
            businessUnitIds.push(parentBusinessUnit.id);
        }

        if (node.type === 'project') {
            projectIds.push(node.id);
        } else if (parentProject) {
            projectIds.push(parentProject.id);
        }

        walk([node], (child, childProject) => {
            if (child.type === 'project' && !projectIds.includes(child.id)) {
                projectIds.push(child.id);
            }
            if (child.type === 'queue') {
                queueIds.push(child.id);
                if (childProject && !projectIds.includes(childProject.id)) {
                    projectIds.push(childProject.id);
                }
            }
        }, parentProject, parentBusinessUnit);

        return {
            businessUnitIds,
            projectIds,
            queueIds
        };
    }

    function getContextScope(type, id, nodes) {
        let found = null;
        walk(nodes || projectStructure, (node, parentProject, parentBusinessUnit) => {
            if (node.id === id) {
                found = { node, parentProject, parentBusinessUnit };
            }
        });

        if (!found) {
            return null;
        }

        const scope = collectScopeFromNode(found.node, found.parentProject, found.parentBusinessUnit);
        const projectId = found.node.type === 'project'
            ? found.node.id
            : (found.parentProject ? found.parentProject.id : (scope.projectIds[0] || null));

        return {
            type: type || found.node.type,
            id: found.node.id,
            entity: clone(found.node),
            projectId,
            projectIds: scope.projectIds,
            queueIds: scope.queueIds,
            businessUnitIds: scope.businessUnitIds
        };
    }

    window.projectStructureData = {
        getProjectStructure,
        findProjectEntityById,
        getContextScope
    };
})(window);
