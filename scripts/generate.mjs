#!/usr/bin/env node
// Generates every animated SVG in /assets from config.json + live GitHub data.
//   node scripts/generate.mjs          -> live data (needs GH_TOKEN, GH_USER)
//   node scripts/generate.mjs --mock   -> sample data (offline preview)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const OUT = path.join(ROOT, 'assets');
fs.mkdirSync(OUT, { recursive: true });
const MOCK = process.argv.includes('--mock');
const LOGIN = process.env.GH_USER || cfg.username;
const TOKEN = process.env.GH_TOKEN;

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Number(n).toLocaleString('en-US');
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const write = (name, svg) => fs.writeFileSync(path.join(OUT, name), svg);

function wrap(text, max, maxLines = 2) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  let i = 0;
  for (; i < words.length; i++) {
    const next = cur ? cur + ' ' + words[i] : words[i];
    if (next.length <= max || !cur) cur = next;
    else {
      lines.push(cur);
      cur = words[i];
      if (lines.length >= maxLines) break;
    }
  }
  let cut = false;
  if (i < words.length) cut = true;
  else if (cur && lines.length < maxLines) lines.push(cur);
  if (cut && lines.length) lines[lines.length - 1] = trunc(lines[lines.length - 1].replace(/[.,;:]$/, '') + '…', max + 1);
  return lines;
}

function ago(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 864e5;
  if (d < 1) return 'today';
  if (d < 2) return 'yesterday';
  if (d < 30) return Math.floor(d) + 'd ago';
  if (d < 365) return Math.floor(d / 30) + 'mo ago';
  return Math.floor(d / 365) + 'y ago';
}

const ICONS = {
  TypeScript: ['TS', '#3178c6', '#fff'], JavaScript: ['JS', '#f7df1e', '#0b1020'], React: ['Re', '#61dafb', '#0b1020'],
  'Node.js': ['No', '#68a063', '#fff'], Dart: ['Dt', '#0175c2', '#fff'], Flutter: ['Fl', '#02569b', '#fff'],
  HTML: ['H5', '#e34f26', '#fff'], CSS: ['C3', '#1572b6', '#fff'], 'C++': ['C+', '#00599c', '#fff'],
  'React Native': ['RN', '#61dafb', '#0b1020'], Expo: ['Ex', '#e5e7eb', '#0b1020'], 'Next.js': ['Nx', '#e5e7eb', '#0b1020'],
  'Tailwind CSS': ['Tw', '#38bdf8', '#0b1020'], Express: ['Ex', '#9ca3af', '#0b1020'], 'REST APIs': ['API', '#a78bfa', '#0b1020'],
  'Socket.IO': ['So', '#e5e7eb', '#0b1020'], MongoDB: ['Mg', '#47a248', '#fff'], Firebase: ['Fb', '#ffca28', '#0b1020'],
  PostgreSQL: ['Pg', '#336791', '#fff'], Git: ['Gt', '#f05032', '#fff'], 'GitHub Actions': ['GA', '#2088ff', '#fff'],
  Docker: ['Dk', '#2496ed', '#fff'], Vercel: ['Vc', '#e5e7eb', '#0b1020'], Postman: ['Pm', '#ff6c37', '#fff'],
  'VS Code': ['VS', '#007acc', '#fff'], Figma: ['Fg', '#f24e1e', '#fff'], Python: ['Py', '#3776ab', '#fff'], Java: ['Jv', '#e76f00', '#fff'],
};
const PAL = ['#38bdf8', '#a855f7', '#ec4899', '#22c55e', '#f59e0b', '#6366f1'];
const iconFor = (name) => ICONS[name] || [name.slice(0, 2), PAL[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PAL.length], '#fff'];

const FRAME = (w, h) => `<rect width="${w}" height="${h}" rx="18" fill="#0b1020" stroke="#6d4cff" stroke-opacity=".6"/>`;
const FONTS = `.mono{font-family:'Courier New',monospace}.sans{font-family:'Segoe UI',Arial,sans-serif}`;
const today = new Date().toISOString().slice(0, 10);
const liveTag = (x, y) => `<g class="mono" font-size="11" fill="#94a3b8"><circle class="blink" cx="${x - 150}" cy="${y - 4}" r="4" fill="#22c55e"/><text x="${x}" y="${y}" text-anchor="end">LIVE · synced ${today}</text></g>`;

// ---------- hero ----------
function heroSvg() {
  const roles = cfg.roles, n = roles.length, p = 100 / n;
  const kf = `0%{opacity:0;transform:translateY(8px)}3%,${(p - 4).toFixed(1)}%{opacity:1;transform:translateY(0)}${(p - 1).toFixed(1)}%,100%{opacity:0}`;
  const texts = roles.map((r, i) => `<text class="r${i ? ' z' : ''}" style="animation-delay:${i * 3}s" x="50" y="205">&gt; ${esc(r)}</text>`).join('\n    ');
  const bw = Math.round(cfg.availability.length * 7.6 + 52);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 260" width="900" height="260">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#1a1040"/></linearGradient>
    <linearGradient id="nm" x1="0" x2="1">
      <stop offset="0" stop-color="#38bdf8"><animate attributeName="stop-color" values="#38bdf8;#a855f7;#ec4899;#38bdf8" dur="6s" repeatCount="indefinite"/></stop>
      <stop offset="1" stop-color="#ec4899"><animate attributeName="stop-color" values="#ec4899;#38bdf8;#a855f7;#ec4899" dur="6s" repeatCount="indefinite"/></stop>
    </linearGradient>
  </defs>
  <style>
    ${FONTS}
    .r{animation:cycle ${3 * n}s infinite}.z{opacity:0}
    @keyframes cycle{${kf}}
    .s{animation:tw 3s infinite ease-in-out}@keyframes tw{0%,100%{opacity:.2}50%{opacity:1}}
    .blink{animation:bl 2s infinite}@keyframes bl{0%,100%{opacity:1}50%{opacity:.35}}
  </style>
  <rect width="900" height="260" rx="18" fill="url(#bg)" stroke="#6d4cff" stroke-opacity=".6"/>
  <g fill="#fff">
    <circle class="s" cx="80" cy="40" r="2"/><circle class="s" cx="300" cy="25" r="1.5" style="animation-delay:.8s"/>
    <circle class="s" cx="620" cy="50" r="2" style="animation-delay:1.4s"/><circle class="s" cx="820" cy="30" r="1.5" style="animation-delay:2s"/>
    <circle class="s" cx="760" cy="215" r="2" style="animation-delay:.5s"/><circle class="s" cx="150" cy="228" r="1.5" style="animation-delay:1.1s"/>
  </g>
  <rect x="50" y="40" width="${bw}" height="26" rx="13" fill="#22c55e" fill-opacity=".12" stroke="#22c55e"/>
  <circle class="blink" cx="68" cy="53" r="5" fill="#22c55e"/>
  <text x="82" y="58" class="mono" font-size="12" fill="#86efac">${esc(cfg.availability)}</text>
  <text x="50" y="105" class="sans" font-size="22" fill="#cbd5e1">Hi there, I'm</text>
  <text x="50" y="160" class="sans" font-size="58" font-weight="800" fill="url(#nm)">${esc(cfg.name)}</text>
  <g class="mono" font-size="20" fill="#e2e8f0">
    ${texts}
  </g>
  <g transform="translate(740 130)">
    <circle r="62" fill="none" stroke="#6d4cff" stroke-opacity=".5" stroke-dasharray="4 6"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/></circle>
    <circle r="38" fill="#7c3aed"><animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite"/></circle>
    <text y="9" text-anchor="middle" class="mono" font-size="26" fill="#fff">&lt;/&gt;</text>
  </g>
</svg>`;
}

// ---------- tech orbit ----------
function techSvg() {
  const X0 = 440, MAXW = 430;
  const parts = [];
  let y = 98, idx = 0;
  for (const [cat, items] of Object.entries(cfg.tech)) {
    parts.push(`<text x="${X0}" y="${y}" class="h">// ${esc(cat)}</text>`);
    let top = y + 10, x = X0;
    for (const it of items) {
      const w = Math.round(it.length * 7.3 + 40);
      if (x + w > X0 + MAXW) { x = X0; top += 36; }
      const color = iconFor(it)[1];
      parts.push(`<g transform="translate(${x} ${top})"><g class="chipg" style="animation-delay:${(idx * 0.06).toFixed(2)}s"><rect class="chip" width="${w}" height="28" rx="8"/><circle cx="14" cy="14" r="4.5" fill="${color}"/><text class="t" x="26" y="19">${esc(it)}</text></g></g>`);
      x += w + 8; idx++;
    }
    y = top + 28 + 28;
  }
  const H = Math.max(440, y + 6);
  const cx = 215, cy = Math.round(H / 2 + 22);
  const radii = [68, 104, 140], durs = [14, 22, 32], dirs = [1, -1, 1];
  const caps = [2, 3, 3, 4];
  const orbit = cfg.orbit;
  let k = 0;
  const rings = radii.map((r, ri) => {
    const cnt = Math.min(caps[ri], orbit.length - k);
    const names = orbit.slice(k, k + Math.max(cnt, 0));
    k += names.length;
    const icons = names.map((nm, j) => {
      const a = (j / names.length) * Math.PI * 2 + ri * 0.7;
      const [lab, bg, fg] = iconFor(nm);
      return `<g transform="translate(${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)})"><g><animateTransform attributeName="transform" type="rotate" from="0" to="${-360 * dirs[ri]}" dur="${durs[ri]}s" repeatCount="indefinite"/><circle r="17" fill="${bg}" stroke="#0b1020" stroke-width="2"/><text y="4.5" text-anchor="middle" class="mono" font-size="12" font-weight="700" fill="${fg}">${esc(lab)}</text></g></g>`;
    }).join('');
    return `<circle r="${r}" fill="none" stroke="#475569" stroke-dasharray="3 7"/><g><animateTransform attributeName="transform" type="rotate" from="0" to="${360 * dirs[ri]}" dur="${durs[ri]}s" repeatCount="indefinite"/>${icons}</g>`;
  }).join('\n    ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${H}" width="900" height="${H}">
  <defs><radialGradient id="core"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#4c1d95"/></radialGradient></defs>
  <style>
    ${FONTS}
    .chip{fill:#111936;stroke:#334155}
    .t{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;fill:#e2e8f0}
    .h{font-family:'Courier New',monospace;font-size:12px;fill:#38bdf8}
    .chipg{animation:pop .5s ease-out backwards}
    @keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  </style>
  ${FRAME(900, H)}
  <text x="30" y="40" class="h">// TECH STACK</text>
  <text x="30" y="68" class="sans" font-size="24" font-weight="700" fill="#fff">Tools I build with</text>
  <g transform="translate(${cx} ${cy})">
    <circle r="42" fill="url(#core)"><animate attributeName="r" values="42;46;42" dur="3s" repeatCount="indefinite"/></circle>
    <text y="8" text-anchor="middle" class="mono" font-size="22" fill="#fff">&lt;/&gt;</text>
    ${rings}
  </g>
  ${parts.join('\n  ')}
</svg>`;
}

// ---------- data ----------
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

function chunkWeeks(days) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push({ days: days.slice(i, i + 7) });
  return weeks;
}

function mockData() {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const end = new Date(); end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - end.getUTCDay() - 52 * 7);
  const raw = [];
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1))
    raw.push({ date: d.toISOString().slice(0, 10), weekday: d.getUTCDay(), r: rnd() < 0.55 ? Math.floor(rnd() * rnd() * 14) + 1 : 0 });
  const f = 793 / raw.reduce((a, b) => a + b.r, 0);
  const days = raw.map((d) => ({ date: d.date, weekday: d.weekday, count: Math.round(d.r * f) }));
  const mx = Math.max(...days.map((d) => d.count));
  days.forEach((d) => { d.level = d.count === 0 ? 0 : d.count <= mx * 0.25 ? 1 : d.count <= mx * 0.5 ? 2 : d.count <= mx * 0.75 ? 3 : 4; });
  const ago_ = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const pin = (name, description, stars, lang, color, n) => ({ name, nameWithOwner: `${LOGIN}/${name}`, description, url: `https://github.com/${LOGIN}/${name}`, stars, forks: 0, pushedAt: ago_(n), lang, color });
  return {
    followers: 8, repoCount: 12, stars: 6,
    pinned: [
      pin('buildmyapp', 'Portfolio, custom app orders and a downloadable software store', 1, 'TypeScript', '#3178c6', 0),
      pin('chatting-app', 'Real-time messaging app with backend and mobile client', 0, 'TypeScript', '#3178c6', 6),
      pin('eduApp', 'Education app for students and teachers', 1, 'TypeScript', '#3178c6', 20),
      pin('digital-board', 'Digital board app', 1, 'TypeScript', '#3178c6', 45),
    ],
    commitsByRepo: { [`${LOGIN}/buildmyapp`]: 120, [`${LOGIN}/chatting-app`]: 96, [`${LOGIN}/eduApp`]: 58, [`${LOGIN}/digital-board`]: 31 },
    totals: { commits: 352, issues: 0, prs: 48, reviews: 0 },
    calendar: { total: days.reduce((a, b) => a + b.count, 0), weeks: chunkWeeks(days) },
  };
}

async function liveData() {
  if (!TOKEN) throw new Error('GH_TOKEN is not set');
  const query = `query($login:String!,$n:Int!){ user(login:$login){
    followers{totalCount}
    repositories(ownerAffiliations:OWNER, privacy:PUBLIC, first:100){ totalCount nodes{ stargazerCount } }
    pinnedItems(first:$n, types:REPOSITORY){ nodes{ ... on Repository{ name nameWithOwner description url stargazerCount forkCount pushedAt primaryLanguage{name color} } } }
    contributionsCollection{
      totalCommitContributions totalIssueContributions totalPullRequestContributions totalPullRequestReviewContributions
      contributionCalendar{ totalContributions weeks{ contributionDays{ contributionCount date contributionLevel weekday } } }
      commitContributionsByRepository(maxRepositories:100){ repository{ nameWithOwner } contributions{ totalCount } }
    } } }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-readme-generator' },
    body: JSON.stringify({ query, variables: { login: LOGIN, n: cfg.maxPinned || 6 } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error('GitHub API error: ' + JSON.stringify(json.errors || res.status));
  const u = json.data.user;
  const cc = u.contributionsCollection;
  const weeks = cc.contributionCalendar.weeks.map((w) => ({
    days: w.contributionDays.map((d) => ({ date: d.date, weekday: d.weekday, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 })),
  }));
  const commitsByRepo = {};
  for (const e of cc.commitContributionsByRepository) commitsByRepo[e.repository.nameWithOwner] = e.contributions.totalCount;
  return {
    followers: u.followers.totalCount,
    repoCount: u.repositories.totalCount,
    stars: u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
    pinned: u.pinnedItems.nodes.filter(Boolean).map((r) => ({
      name: r.name, nameWithOwner: r.nameWithOwner, description: r.description, url: r.url, stars: r.stargazerCount, forks: r.forkCount,
      pushedAt: r.pushedAt, lang: r.primaryLanguage?.name || '', color: r.primaryLanguage?.color || '#94a3b8',
    })),
    commitsByRepo,
    totals: { commits: cc.totalCommitContributions, issues: cc.totalIssueContributions, prs: cc.totalPullRequestContributions, reviews: cc.totalPullRequestReviewContributions },
    calendar: { total: cc.contributionCalendar.totalContributions, weeks },
  };
}

// ---------- dashboard (ID badge) ----------
function dashSvg(D) {
  const proj = D.pinned.slice(0, 5).map((p) => ({ name: p.name, c: D.commitsByRepo[p.nameWithOwner] || 0 }));
  const max = Math.max(1, ...proj.map((p) => p.c));
  const H = Math.max(300, 222 + proj.length * 26 + 30);
  const tiles = [[fmt(D.calendar.total), 'CONTRIBUTIONS / YEAR'], [fmt(D.repoCount), 'PUBLIC REPOS'], [fmt(D.stars), 'TOTAL STARS'], [fmt(D.followers), 'FOLLOWERS']]
    .map(([v, l], i) => `<g class="up" style="animation-delay:${i * 0.12}s"><rect x="${320 + i * 140}" y="100" width="128" height="64" rx="10" fill="#111936" stroke="#334155"/><text x="${336 + i * 140}" y="138" class="sans" font-size="28" font-weight="800" fill="#fff">${esc(v)}</text><text x="${336 + i * 140}" y="154" class="mono" font-size="9" fill="#94a3b8">${l}</text></g>`).join('');
  const bars = proj.map((p, i) => {
    const y = 226 + i * 26;
    const w = p.c ? Math.max(8, Math.round((p.c / max) * 300)) : 0;
    const col = ['#a855f7', '#6366f1', '#38bdf8', '#22c55e', '#ec4899'][i % 5];
    return `<text x="320" y="${y}" class="mono" font-size="12" fill="#e2e8f0">${esc(trunc(p.name, 14))}</text><rect x="440" y="${y - 10}" width="300" height="10" rx="5" fill="#1e293b"/><rect class="bar" x="440" y="${y - 10}" width="${w}" height="10" rx="5" fill="${col}" style="animation-delay:${i * 0.2}s"/><text x="752" y="${y}" class="mono" font-size="11" fill="#94a3b8">${p.c ? p.c + ' commits' : 'new'}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${H}" width="900" height="${H}">
  <style>
    ${FONTS}
    .swing{transform-origin:150px 20px;animation:sw 4s ease-in-out infinite}
    @keyframes sw{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
    .bar{transform-box:fill-box;transform-origin:left;animation:grow 1.6s ease-out backwards}
    @keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
    .up{animation:up .6s ease-out backwards}@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .blink{animation:bl 2s infinite}@keyframes bl{0%,100%{opacity:1}50%{opacity:.35}}
  </style>
  ${FRAME(900, H)}
  <g class="swing">
    <rect x="140" y="0" width="20" height="50" fill="#a855f7"/>
    <rect x="50" y="50" width="200" height="232" rx="16" fill="#1e1b4b" stroke="#818cf8"/>
    <rect x="68" y="68" width="40" height="28" rx="6" fill="#facc15"/>
    <circle cx="150" cy="136" r="42" fill="#312e81" stroke="#a78bfa"/>
    <text x="150" y="148" text-anchor="middle" class="mono" font-size="34" fill="#fff">${esc(cfg.initials)}</text>
    <text x="150" y="208" text-anchor="middle" class="sans" font-size="20" font-weight="700" fill="#fff">${esc(cfg.name)}</text>
    <text x="150" y="228" text-anchor="middle" class="mono" font-size="11" fill="#a5b4fc">${esc(cfg.badge.line1)}</text>
    <text x="150" y="243" text-anchor="middle" class="mono" font-size="11" fill="#a5b4fc">${esc(cfg.badge.line2)}</text>
    <text x="150" y="268" text-anchor="middle" class="mono" font-size="10" fill="#22c55e">${esc(cfg.badge.status)}</text>
  </g>
  <text x="320" y="50" class="mono" font-size="12" fill="#38bdf8">// DEVELOPER DASHBOARD</text>
  <text x="320" y="80" class="sans" font-size="24" font-weight="700" fill="#fff">Profile at a glance</text>
  ${liveTag(870, 50)}
  ${tiles}
  <text x="320" y="198" class="mono" font-size="11" fill="#94a3b8">MY PINNED PROJECTS · COMMITS THIS YEAR</text>
  ${bars}
</svg>`;
}

// ---------- live pinned projects ----------
function projectsSvg(D) {
  const W = 418, Hc = 124, X1 = 24, X2 = 24 + W + 16;
  const list = D.pinned;
  const rows = Math.max(1, Math.ceil(list.length / 2));
  const H = 82 + rows * 140 + 4;
  const P = 2 * (W + Hc);
  const cards = list.map((p, i) => {
    const x = i % 2 ? X2 : X1, y = 82 + Math.floor(i / 2) * 140;
    const desc = wrap(p.description || 'No description yet. Add one in the repo settings.', 56, 2);
    return `<g transform="translate(${x} ${y})"><g class="card" style="animation-delay:${(i * 0.15).toFixed(2)}s">
    <rect width="${W}" height="${Hc}" rx="14" fill="#111936" stroke="#334155"/>
    <rect width="${W}" height="${Hc}" rx="14" fill="none" stroke="url(#glow)" stroke-width="2" stroke-dasharray="90 ${P - 90 + 1}" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="0" to="${-(P + 1)}" dur="${6 + (i % 3)}s" repeatCount="indefinite"/></rect>
    <text x="20" y="34" class="sans" font-size="17" font-weight="700" fill="#fff">${esc(trunc(p.name, 30))}</text>
    <text x="${W - 20}" y="34" text-anchor="end" class="mono" font-size="10" fill="#64748b">PINNED</text>
    ${desc.map((l, j) => `<text x="20" y="${60 + j * 18}" class="sans" font-size="12.5" fill="#94a3b8">${esc(l)}</text>`).join('')}
    <circle cx="26" cy="104" r="5" fill="${esc(p.color)}"/>
    <text x="38" y="108" class="sans" font-size="12" fill="#cbd5e1">${esc(p.lang || '—')}</text>
    <text x="160" y="108" class="sans" font-size="12" fill="#facc15">★ ${p.stars}</text>
    <text x="215" y="108" class="sans" font-size="12" fill="#a5b4fc">⑂ ${p.forks}</text>
    <text x="${W - 20}" y="108" text-anchor="end" class="mono" font-size="10" fill="#64748b">updated ${esc(ago(p.pushedAt))}</text>
  </g></g>`;
  }).join('\n  ');
  const empty = list.length ? '' : `<text x="450" y="130" text-anchor="middle" class="sans" font-size="15" fill="#94a3b8">Pin repositories on your GitHub profile and they will show up here.</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${H}" width="900" height="${H}">
  <defs><linearGradient id="glow" x1="0" x2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
  <style>
    ${FONTS}
    .card{animation:rise .7s ease-out backwards}
    @keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .blink{animation:bl 2s infinite}@keyframes bl{0%,100%{opacity:1}50%{opacity:.35}}
  </style>
  ${FRAME(900, H)}
  <text x="30" y="40" class="mono" font-size="12" fill="#38bdf8">// PINNED PROJECTS</text>
  <text x="30" y="68" class="sans" font-size="24" font-weight="700" fill="#fff">Live from my GitHub</text>
  ${liveTag(870, 40)}
  ${cards}
  ${empty}
</svg>`;
}

// ---------- contributions ----------
function contribSvg(D) {
  const weeks = D.calendar.weeks;
  const days = weeks.flatMap((w) => w.days);
  let longest = 0, run = 0;
  for (const d of days) { if (d.count > 0) { run++; longest = Math.max(longest, run); } else run = 0; }
  let cur = 0;
  for (let i = days.length - 1; i >= 0; i--) { if (days[i].count > 0) cur++; else if (i === days.length - 1) continue; else break; }
  const best = Math.max(0, ...days.map((d) => d.count));

  const pitch = 15.2, cell = 12, X0 = 62, Y0 = 158;
  const COL = ['#161b33', '#1e3a8a', '#4f46e5', '#a855f7', '#ec4899'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let cells = '', months = '', lastM = -1, lastX = -99;
  weeks.forEach((w, wi) => {
    const m = new Date(w.days[0].date + 'T00:00:00Z').getUTCMonth();
    if (m !== lastM) {
      const x = X0 + wi * pitch;
      if (x - lastX > 34) { months += `<text x="${x.toFixed(1)}" y="148" class="mono" font-size="10" fill="#94a3b8">${MON[m]}</text>`; lastX = x; }
      lastM = m;
    }
    w.days.forEach((d) => {
      cells += `<rect class="c" x="${(X0 + wi * pitch).toFixed(1)}" y="${(Y0 + d.weekday * pitch).toFixed(1)}" width="${cell}" height="${cell}" rx="3" fill="${COL[d.level]}" style="animation-delay:${(wi * 0.025 + d.weekday * 0.015).toFixed(3)}s"><title>${d.count} contributions on ${d.date}</title></rect>`;
    });
  });
  const dayLabels = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']].map(([r, t]) => `<text x="30" y="${(Y0 + r * pitch + 10).toFixed(1)}" class="mono" font-size="10" fill="#94a3b8">${t}</text>`).join('');
  const gridW = weeks.length * pitch;
  const legend = `<text x="722" y="286" text-anchor="end" class="mono" font-size="10" fill="#94a3b8">Less</text>` + COL.map((c, i) => `<rect x="${730 + i * 17}" y="276" width="12" height="12" rx="3" fill="${c}"/>`).join('') + `<text x="820" y="286" class="mono" font-size="10" fill="#94a3b8">More</text>`;

  const tiles = [[fmt(D.calendar.total), 'CONTRIBUTIONS · LAST YEAR'], [cur + ' days', 'CURRENT STREAK'], [longest + ' days', 'LONGEST STREAK'], [best, 'BEST DAY']]
    .map(([v, l], i) => `<g class="up" style="animation-delay:${i * 0.12}s"><rect x="${25 + i * 216}" y="62" width="202" height="62" rx="10" fill="#111936" stroke="#334155"/><text x="${41 + i * 216}" y="96" class="sans" font-size="26" font-weight="800" fill="#fff">${esc(v)}</text><text x="${41 + i * 216}" y="114" class="mono" font-size="9" fill="#94a3b8">${l}</text></g>`).join('');

  // skyline: weekly totals
  const wk = weeks.map((w) => w.days.reduce((a, d) => a + d.count, 0));
  const wmax = Math.max(1, ...wk);
  const SX = 34, SB = 506, SH = 140, sp = 530 / wk.length;
  const sky = wk.map((v, i) => {
    const h = Math.max(2, Math.round((v / wmax) * SH));
    return `<rect class="sk" x="${(SX + i * sp).toFixed(1)}" y="${SB - h}" width="${(sp * 0.7).toFixed(1)}" height="${h}" rx="1.5" fill="url(#sky)" style="animation-delay:${(i * 0.025).toFixed(3)}s"><title>${v} contributions this week</title></rect>`;
  }).join('');

  // radar
  const t = D.totals;
  const vals = { review: t.reviews, issues: t.issues, pr: t.prs, commits: t.commits };
  const sum = Math.max(1, t.reviews + t.issues + t.prs + t.commits);
  const vmax = Math.max(1, ...Object.values(vals));
  const R = 64, RX = 745, RY = 438;
  const pt = (v, ang) => `${(R * (v / vmax) * Math.cos(ang)).toFixed(1)},${(R * (v / vmax) * Math.sin(ang)).toFixed(1)}`;
  const A = { review: -Math.PI / 2, issues: 0, pr: Math.PI / 2, commits: Math.PI };
  const poly = Object.keys(vals).map((k) => pt(vals[k], A[k])).join(' ');
  const pct = (v) => Math.round((v / sum) * 100) + '%';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 548" width="900" height="548">
  <defs>
    <linearGradient id="sky" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ec4899"/><stop offset=".55" stop-color="#a855f7"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>
    <linearGradient id="scan" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <style>
    ${FONTS}
    .c{transform-box:fill-box;transform-origin:center;animation:cp .5s ease-out backwards}
    @keyframes cp{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}
    .sk{transform-box:fill-box;transform-origin:bottom;animation:gr .9s ease-out backwards}
    @keyframes gr{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    .up{animation:up .6s ease-out backwards}@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .blink{animation:bl 2s infinite}@keyframes bl{0%,100%{opacity:1}50%{opacity:.35}}
  </style>
  ${FRAME(900, 548)}
  <text x="30" y="40" class="mono" font-size="12" fill="#38bdf8">// CONTRIBUTION ACTIVITY</text>
  ${liveTag(870, 40)}
  ${tiles}
  ${months}
  ${dayLabels}
  ${cells}
  <rect x="${X0 - 30}" y="${Y0 - 2}" width="30" height="${(7 * pitch).toFixed(1)}" fill="url(#scan)"><animate attributeName="x" from="${X0 - 30}" to="${(X0 + gridW).toFixed(1)}" dur="5s" repeatCount="indefinite"/></rect>
  ${legend}
  <line x1="25" y1="306" x2="875" y2="306" stroke="#334155"/>
  <text x="30" y="334" class="mono" font-size="12" fill="#38bdf8">// WEEKLY SKYLINE</text>
  ${sky}
  <line x1="28" y1="${SB + 1}" x2="572" y2="${SB + 1}" stroke="#475569"/>
  <text x="30" y="528" class="mono" font-size="10" fill="#64748b">past 52 weeks · taller = more contributions</text>
  <line x1="600" y1="318" x2="600" y2="530" stroke="#334155"/>
  <text x="625" y="334" class="mono" font-size="12" fill="#38bdf8">// ACTIVITY MIX</text>
  <g transform="translate(${RX} ${RY})">
    <circle r="${R}" fill="none" stroke="#334155" stroke-dasharray="3 5"/><circle r="${R / 2}" fill="none" stroke="#334155" stroke-dasharray="3 5"/>
    <line x1="${-R}" x2="${R}" stroke="#475569"/><line y1="${-R}" y2="${R}" stroke="#475569"/>
    <polygon points="${poly}" fill="#a855f7" fill-opacity=".35" stroke="#ec4899" stroke-width="2"><animateTransform attributeName="transform" type="scale" from="0" to="1" dur="1.4s" fill="freeze"/></polygon>
    <text y="${-R - 8}" text-anchor="middle" class="mono" font-size="10" fill="#cbd5e1">Code review ${pct(vals.review)}</text>
    <text y="${R + 18}" text-anchor="middle" class="mono" font-size="10" fill="#cbd5e1">Pull requests ${pct(vals.pr)}</text>
    <text x="${R + 8}" y="4" class="mono" font-size="10" fill="#cbd5e1">Issues</text>
    <text x="${R + 8}" y="16" class="mono" font-size="10" fill="#cbd5e1">${pct(vals.issues)}</text>
    <text x="${-R - 8}" y="4" text-anchor="end" class="mono" font-size="10" fill="#cbd5e1">Commits</text>
    <text x="${-R - 8}" y="16" text-anchor="end" class="mono" font-size="10" fill="#cbd5e1">${pct(vals.commits)}</text>
  </g>
</svg>`;
}

// ---------- README links ----------
function updateReadme(D) {
  const file = path.join(ROOT, 'README.md');
  if (!fs.existsSync(file)) return;
  const links = D.pinned.map((p) => `<a href="${esc(p.url)}">${esc(p.name)}</a>`).join(' &nbsp;·&nbsp; ');
  const block = `<!--PINNED_LINKS:START-->\n<div align="center">\n\n🔗 ${links || 'Pin some repositories to see them here'}\n\n</div>\n<!--PINNED_LINKS:END-->`;
  const src = fs.readFileSync(file, 'utf8');
  const next = src.replace(/<!--PINNED_LINKS:START-->[\s\S]*?<!--PINNED_LINKS:END-->/, block);
  if (next !== src) fs.writeFileSync(file, next);
}

// ---------- run ----------
write('hero.svg', heroSvg());
write('tech-orbit.svg', techSvg());
const D = MOCK ? mockData() : await liveData();
write('id-dashboard.svg', dashSvg(D));
write('projects.svg', projectsSvg(D));
write('contributions.svg', contribSvg(D));
updateReadme(D);
console.log(`done (${MOCK ? 'mock' : 'live'} data) · pinned: ${D.pinned.map((p) => p.name).join(', ') || 'none'}`);
