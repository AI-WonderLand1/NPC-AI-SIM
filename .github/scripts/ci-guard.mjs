import { readFileSync } from 'node:fs';
const workflow = readFileSync('.github/workflows/deploy-upcloud.yml', 'utf8');
const beforeJobs = workflow.split(/^jobs:\s*$/m)[0];
const build = workflow.split(/^  build:\s*$/m)[1]?.split(/^  deploy:\s*$/m)[0] || '';
const deploy = workflow.split(/^  deploy:\s*$/m)[1] || '';
const failures = [];
if (/secrets\./.test(beforeJobs) || /secrets\./.test(build)) failures.push('NPC PR build must not receive production secrets.');
if (!/github\.event_name != 'pull_request'/.test(deploy)) failures.push('Production NPC deploy must be disabled in PRs.');
if (!/github\.ref == 'refs\/heads\/main'/.test(deploy)) failures.push('Production NPC deploy must be main-only.');
if (!/reset --hard "\$EXPECTED_SHA"/.test(deploy)) failures.push('NPC deploy must pin the tested commit SHA.');
if (/209\.50\.53\.112/.test(deploy)) failures.push('Do not silently target the previous shared host; configure the dedicated NPC server.');
if (failures.length) {
  failures.forEach((error) => console.error(`::error::${error}`));
  process.exitCode = 1;
} else {
  console.log('NPC CI/deploy isolation checks passed (targeted static assertions).');
}
