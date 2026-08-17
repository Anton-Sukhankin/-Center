import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const EXCLUDED_PARTS = [
    `${path.sep}.git${path.sep}`,
    `${path.sep}legacy${path.sep}isolated${path.sep}`,
    `${path.sep}documentation-methodology-kit${path.sep}`,
    `${path.sep}node_modules${path.sep}`
];

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.html', '.js', '.mjs', '.css']);
const VISUAL_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp']);

function relative(root, file) {
    return path.relative(root, file).split(path.sep).join('/');
}

function finding(code, file, message, severity = 'error') {
    return { code, file, message, severity };
}

function isExcluded(file) {
    const normalized = `${path.sep}${path.resolve(file)}${path.sep}`;
    return EXCLUDED_PARTS.some((part) => normalized.includes(part));
}

async function exists(target) {
    try {
        await fs.access(target);
        return true;
    } catch {
        return false;
    }
}

async function walk(root, predicate = () => true) {
    if (!(await exists(root))) return [];
    const output = [];

    async function visit(directory) {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            const target = path.join(directory, entry.name);
            if (isExcluded(target)) continue;
            if (entry.isDirectory()) {
                await visit(target);
            } else if (entry.isFile() && predicate(target)) {
                output.push(target);
            }
        }
    }

    await visit(root);
    return output;
}

export async function checkMarkdownLinks(root) {
    const findings = [];
    const markdownFiles = await walk(root, (file) => path.extname(file).toLowerCase() === '.md');
    const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

    for (const file of markdownFiles) {
        const source = await fs.readFile(file, 'utf8');
        for (const match of source.matchAll(linkPattern)) {
            const rawTarget = match[1].trim().replace(/^<|>$/g, '');
            if (/^(?:https?:|mailto:|data:|#)/i.test(rawTarget)) continue;
            const filePart = rawTarget.split('#')[0];
            if (!filePart) continue;
            const resolved = path.resolve(path.dirname(file), decodeURIComponent(filePart));
            if (!(await exists(resolved))) {
                findings.push(finding('BROKEN_MARKDOWN_LINK', relative(root, file), `Не найдено: ${rawTarget}`));
            }
        }
    }

    return findings;
}

export async function checkOwnerReadmes(root) {
    const findings = [];
    for (const group of ['components', 'features']) {
        const groupRoot = path.join(root, 'src', group);
        if (!(await exists(groupRoot))) continue;
        const entries = await fs.readdir(groupRoot, { withFileTypes: true });
        for (const entry of entries.filter((item) => item.isDirectory())) {
            const readme = path.join(groupRoot, entry.name, 'README.md');
            if (!(await exists(readme))) {
                findings.push(finding('MISSING_LOCAL_README', relative(root, path.join(groupRoot, entry.name)), 'У активного component/feature отсутствует README.md'));
            }
        }
    }
    return findings;
}

export async function checkPlanRegistries(root) {
    const findings = [];
    const groups = [
        { directory: path.join(root, 'docs', 'plans'), registry: path.join(root, 'docs', 'plans', 'README.md'), code: 'UNREGISTERED_ACTIVE_PLAN' },
        { directory: path.join(root, 'docs', 'archive', 'plans'), registry: path.join(root, 'docs', 'archive', 'plans', 'README.md'), code: 'UNREGISTERED_ARCHIVED_PLAN' }
    ];

    for (const group of groups) {
        if (!(await exists(group.directory)) || !(await exists(group.registry))) continue;
        const registry = await fs.readFile(group.registry, 'utf8');
        const entries = await fs.readdir(group.directory, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isFile() || path.extname(entry.name) !== '.md' || entry.name === 'README.md') continue;
            if (!registry.includes(entry.name)) {
                findings.push(finding(group.code, relative(root, path.join(group.directory, entry.name)), `Файл не зарегистрирован в ${relative(root, group.registry)}`));
            }
        }
    }
    return findings;
}

export async function checkDocumentationRegistry(root) {
    const registryFile = path.join(root, 'docs', 'README.md');
    if (!(await exists(registryFile))) {
        return [finding('MISSING_DOCUMENTATION_REGISTRY', 'docs/README.md', 'Отсутствует постоянный реестр документации')];
    }

    const registry = await fs.readFile(registryFile, 'utf8');
    const candidates = [];
    const rootEntries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of rootEntries) {
        if (entry.isFile() && path.extname(entry.name) === '.md') {
            candidates.push({ file: path.join(root, entry.name), key: `../${entry.name}` });
        }
    }

    for (const directory of [path.join(root, 'docs'), path.join(root, 'docs', 'plans'), path.join(root, 'docs', 'audits')]) {
        if (!(await exists(directory))) continue;
        const entries = await fs.readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isFile() || path.extname(entry.name) !== '.md') continue;
            const file = path.join(directory, entry.name);
            candidates.push({ file, key: relative(path.join(root, 'docs'), file) });
        }
    }

    const readmes = await walk(path.join(root, 'src'), (file) => path.basename(file) === 'README.md');
    for (const file of readmes) {
        candidates.push({ file, key: `../${relative(root, file)}` });
    }

    const seen = new Set();
    const findings = [];
    for (const candidate of candidates) {
        if (seen.has(candidate.file)) continue;
        seen.add(candidate.file);
        if (!registry.includes(candidate.key)) {
            findings.push(finding('UNREGISTERED_OWNER_DOCUMENT', relative(root, candidate.file), `Нет записи ${candidate.key} в docs/README.md`));
        }
    }
    return findings;
}

export async function checkVisualReferences(root) {
    const findings = [];
    const visualRoots = [path.join(root, 'docs', 'reference'), path.join(root, 'docs', 'evidence')];
    const visuals = [];
    for (const visualRoot of visualRoots) {
        visuals.push(...await walk(visualRoot, (file) => VISUAL_EXTENSIONS.has(path.extname(file).toLowerCase())));
    }

    const textFiles = await walk(root, (file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()));
    const corpus = (await Promise.all(textFiles.map((file) => fs.readFile(file, 'utf8')))).join('\n');
    for (const visual of visuals) {
        if (!corpus.includes(path.basename(visual))) {
            findings.push(finding('UNREGISTERED_VISUAL', relative(root, visual), 'Visual asset не упомянут ни в manifest, ни у постоянного владельца'));
        }
    }
    return findings;
}

export async function checkExactDuplicates(root) {
    const findings = [];
    const files = await walk(root);
    const groups = new Map();

    for (const file of files) {
        const bytes = await fs.readFile(file);
        const hash = crypto.createHash('sha256').update(bytes).digest('hex');
        const group = groups.get(hash) || [];
        group.push(file);
        groups.set(hash, group);
    }

    for (const group of groups.values()) {
        if (group.length < 2) continue;
        findings.push(finding('EXACT_DUPLICATE', group.map((file) => relative(root, file)).join(', '), 'Файлы имеют одинаковое SHA-256', 'warning'));
    }
    return findings;
}

export async function checkPilotContracts(root) {
    const contracts = [
        {
            file: 'src/components/navigation-tree-item/README.md',
            sections: ['## Текущая реализация', '## Будущая модель', '## Acceptance', '### Межкомпонентный контракт']
        },
        {
            file: 'src/features/chat/README.md',
            sections: ['## Пространственный контракт', '## Межкомпонентные контракты', '## Будущие требования', '## Минимальная приемка']
        },
        {
            file: 'src/features/tasks/README.md',
            sections: ['## Пространственный контракт', '## Будущая модель', '## Acceptance', '### Межкомпонентные переходы']
        }
    ];
    const findings = [];

    for (const contract of contracts) {
        const target = path.join(root, contract.file);
        if (!(await exists(target))) continue;
        const source = await fs.readFile(target, 'utf8');
        for (const section of contract.sections) {
            if (!source.includes(section)) {
                findings.push(finding('INCOMPLETE_PILOT_CONTRACT', contract.file, `Отсутствует раздел: ${section}`));
            }
        }
    }
    return findings;
}

export async function checkMethodologyIsolation(root) {
    const findings = [];
    const textFiles = await walk(root, (file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()));
    for (const file of textFiles) {
        const rel = relative(root, file);
        if (rel === 'DOCUMENTATION_METHODOLOGY_MIGRATION_PLAN.md' || rel === 'scripts/check-documentation.mjs') continue;
        const source = await fs.readFile(file, 'utf8');
        if (source.includes('documentation-methodology-kit')) {
            findings.push(finding('METHODOLOGY_REFERENCE_IN_ACTIVE_CONTEXT', rel, 'Активный файл ссылается на временный неавторитетный пакет'));
        }
    }
    return findings;
}

export async function checkPathReferences(root) {
    const findings = [];
    const files = [
        ...await walk(path.join(root, 'docs'), (file) => path.extname(file) === '.md' && !relative(root, file).startsWith('docs/archive/') && !relative(root, file).startsWith('docs/audits/') && !relative(root, file).startsWith('docs/evidence/') && !relative(root, file).startsWith('docs/reference/')),
        ...await walk(path.join(root, 'src'), (file) => path.basename(file) === 'README.md')
    ];
    const codeSpan = /`((?:src|docs|assets|scripts)\/[A-Za-zА-Яа-яЁё0-9_./-]+\.[A-Za-z0-9]+)`/g;

    for (const file of files) {
        const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/);
        let heading = '';
        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index];
            if (/^#{1,6}\s/.test(line)) heading = line;
            if (/Открытые вопросы|Будущ|Целев/i.test(heading)) continue;
            for (const match of line.matchAll(codeSpan)) {
                const target = path.join(root, ...match[1].split('/'));
                if (!(await exists(target))) {
                    findings.push(finding('BROKEN_PATH_REFERENCE', `${relative(root, file)}:${index + 1}`, `Не найдено: ${match[1]}`));
                }
            }
        }
    }
    return findings;
}

export async function runDocumentationChecks(root = process.cwd()) {
    const checks = [
        checkMarkdownLinks,
        checkOwnerReadmes,
        checkPlanRegistries,
        checkDocumentationRegistry,
        checkVisualReferences,
        checkExactDuplicates,
        checkPilotContracts,
        checkMethodologyIsolation,
        checkPathReferences
    ];
    const groups = await Promise.all(checks.map((check) => check(root)));
    return groups.flat().sort((left, right) => left.file.localeCompare(right.file) || left.code.localeCompare(right.code));
}

async function main() {
    const root = path.resolve(process.argv[2] || process.cwd());
    const findings = await runDocumentationChecks(root);
    const errors = findings.filter((item) => item.severity === 'error');
    const warnings = findings.filter((item) => item.severity === 'warning');

    for (const item of findings) {
        console.log(`${item.severity.toUpperCase()} ${item.code} ${item.file}: ${item.message}`);
    }
    console.log(`documentation-check: errors=${errors.length}, warnings=${warnings.length}`);
    if (errors.length > 0) process.exitCode = 1;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
    await main();
}
