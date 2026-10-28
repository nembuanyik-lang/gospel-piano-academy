// Quick project checks, run before every build and in CI:
//   node scripts/check.js            syntax of every script, app version matches package.json, index.html loads every file
//   node scripts/check.js --release  also requires exact dependency versions and a committed package-lock.json
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const release = process.argv.includes('--release');
const problems = [], warnings = [];

const files = ['main.js', 'preload.js', ...fs.readdirSync(path.join(root, 'scripts')).map(f => 'scripts/' + f),
  ...fs.readdirSync(path.join(root, 'app', 'js')).map(f => 'app/js/' + f)].filter(f => f.endsWith('.js'));
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'pipe' }); }
  catch (e) { problems.push('Syntax error in ' + f + ':\n' + String(e.stderr || e.message)); }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const about = fs.readFileSync(path.join(root, 'app', 'js', 'about.js'), 'utf8');
const m = /const APP_VERSION = '([^']+)'/.exec(about);
if (!m || m[1] !== pkg.version) problems.push('app/js/about.js APP_VERSION (' + (m && m[1]) + ') does not match package.json version (' + pkg.version + ').');

const html = fs.readFileSync(path.join(root, 'app', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(x => x[1]);
for (const s of scripts) if (!fs.existsSync(path.join(root, 'app', s))) problems.push('index.html loads a missing file: ' + s);
for (const f of fs.readdirSync(path.join(root, 'app', 'js'))) if (!scripts.includes('js/' + f)) warnings.push('app/js/' + f + ' is not loaded by index.html');
if (/<script>(?!\s*<\/script>)/.test(html)) problems.push('index.html contains an inline script, which the Content-Security-Policy blocks.');

const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
const loose = Object.keys(deps).filter(k => !/^\d+\.\d+\.\d+$/.test(deps[k]));
const lock = fs.existsSync(path.join(root, 'package-lock.json'));
const pinMsg = 'Run "npm run pin" once, then commit package.json and package-lock.json.';
if (loose.length) (release ? problems : warnings).push('Dependencies without an exact version: ' + loose.join(', ') + '. ' + pinMsg);
if (!lock) (release ? problems : warnings).push('package-lock.json is missing. ' + pinMsg);

warnings.forEach(w => console.warn('warning: ' + w));
if (problems.length) { problems.forEach(p => console.error('problem: ' + p)); process.exit(1); }
console.log('Checks passed (' + files.length + ' scripts).');
