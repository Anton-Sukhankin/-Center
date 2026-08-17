import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
    checkMarkdownLinks,
    checkOwnerReadmes,
    checkPlanRegistries,
    checkVisualReferences
} from './check-documentation.mjs';

async function fixture() {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'scenter-doc-check-'));
    await fs.mkdir(path.join(root, 'docs', 'plans'), { recursive: true });
    await fs.mkdir(path.join(root, 'docs', 'archive', 'plans'), { recursive: true });
    await fs.mkdir(path.join(root, 'docs', 'reference'), { recursive: true });
    await fs.mkdir(path.join(root, 'src', 'components', 'sample'), { recursive: true });
    await fs.mkdir(path.join(root, 'src', 'features', 'sample'), { recursive: true });
    await fs.writeFile(path.join(root, 'docs', 'plans', 'README.md'), '# Plans\n', 'utf8');
    await fs.writeFile(path.join(root, 'docs', 'archive', 'plans', 'README.md'), '# Archive\n', 'utf8');
    await fs.writeFile(path.join(root, 'src', 'components', 'sample', 'README.md'), '# Component\n', 'utf8');
    await fs.writeFile(path.join(root, 'src', 'features', 'sample', 'README.md'), '# Feature\n', 'utf8');
    return root;
}

test('broken Markdown link is reported', async (context) => {
    const root = await fixture();
    context.after(() => fs.rm(root, { recursive: true, force: true }));
    await fs.writeFile(path.join(root, 'README.md'), '[missing](docs/missing.md)\n', 'utf8');
    const findings = await checkMarkdownLinks(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].code, 'BROKEN_MARKDOWN_LINK');
});

test('component without README is reported', async (context) => {
    const root = await fixture();
    context.after(() => fs.rm(root, { recursive: true, force: true }));
    await fs.mkdir(path.join(root, 'src', 'components', 'missing-owner'));
    const findings = await checkOwnerReadmes(root);
    assert.equal(findings.some((item) => item.code === 'MISSING_LOCAL_README'), true);
});

test('unregistered active plan is reported', async (context) => {
    const root = await fixture();
    context.after(() => fs.rm(root, { recursive: true, force: true }));
    await fs.writeFile(path.join(root, 'docs', 'plans', 'unregistered.md'), '# Plan\n', 'utf8');
    const findings = await checkPlanRegistries(root);
    assert.equal(findings.some((item) => item.code === 'UNREGISTERED_ACTIVE_PLAN'), true);
});

test('unmentioned visual asset is reported', async (context) => {
    const root = await fixture();
    context.after(() => fs.rm(root, { recursive: true, force: true }));
    await fs.writeFile(path.join(root, 'docs', 'reference', 'orphan.png'), Buffer.from([1, 2, 3]));
    const findings = await checkVisualReferences(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].code, 'UNREGISTERED_VISUAL');
});
