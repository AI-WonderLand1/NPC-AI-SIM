import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/deploy-upcloud.yml', 'utf8');
const failures = [];

// This repository currently verifies a Railway/Docker build in CI; it does not
// deploy production from pull requests. Keep that safer contract explicit.
if (/secrets\./.test(workflow)) failures.push('NPC verification workflow must not receive production secrets.');
if (/^\s{2}deploy:\s*$/m.test(workflow)) failures.push('Production deployment must not be embedded in the PR verification workflow.');
if (/\b(?:ssh|scp|rsync)\b/i.test(workflow)) failures.push('PR verification must not perform remote deployment actions.');
if (/209\.50\.53\.112/.test(workflow)) failures.push('Do not silently target the previous shared host.');

if (failures.length) {
  failures.forEach((error) => console.error(`::error::${error}`));
  process.exitCode = 1;
} else {
  console.log('NPC CI secret-isolation checks passed.');
}
