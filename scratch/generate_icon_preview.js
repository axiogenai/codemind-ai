const fs = require('fs');
const lucide = require('lucide-react');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const sets = [
  {
    title: 'Set 1: Developer Native (FolderGit2 + PackageOpen + Radar)',
    icons: [
      { name: 'FolderGit2', label: 'Local Folder', color: '#38bdf8' },
      { name: 'PackageOpen', label: 'Upload ZIP', color: '#a78bfa' },
      { name: 'Radar', label: 'Web / URL', color: '#34d399' }
    ]
  },
  {
    title: 'Set 2: Infrastructure & Delivery (HardDrive + Boxes + Waypoints)',
    icons: [
      { name: 'HardDrive', label: 'Local Folder', color: '#60a5fa' },
      { name: 'Boxes', label: 'Upload ZIP', color: '#c084fc' },
      { name: 'Waypoints', label: 'Web / URL', color: '#2dd4bf' }
    ]
  },
  {
    title: 'Set 3: Deep Reverse-Engineering (FolderCode + Archive + Compass)',
    icons: [
      { name: 'FolderCode', label: 'Local Folder', color: '#38bdf8' },
      { name: 'Archive', label: 'Upload ZIP', color: '#f472b6' },
      { name: 'Compass', label: 'Web / URL', color: '#fbbf24' }
    ]
  },
  {
    title: 'Set 4: Precision Modern (Terminal + PackageCheck + ScanSearch)',
    icons: [
      { name: 'Terminal', label: 'Local Folder', color: '#38bdf8' },
      { name: 'PackageCheck', label: 'Upload ZIP', color: '#818cf8' },
      { name: 'ScanSearch', label: 'Web / URL', color: '#4ade80' }
    ]
  }
];

let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0A0A0A] text-white p-8 font-sans space-y-8 flex flex-col items-center">
  <div class="max-w-xl w-full space-y-6">
    <h2 class="text-sm font-mono text-zinc-400 uppercase tracking-widest text-center">Tab Icon Candidates Comparison</h2>
`;

sets.forEach((s, idx) => {
  html += `
    <div class="p-4 rounded-2xl bg-[#121316] border border-white/5 space-y-2.5">
      <div class="text-xs font-mono text-zinc-300 font-medium">${s.title}</div>
      <div class="grid grid-cols-3 p-1 rounded-xl bg-zinc-900/90 border border-white/5 gap-1">
  `;
  s.icons.forEach((item, i) => {
    const Component = lucide[item.name];
    const svg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Component, { size: 15, strokeWidth: 2, color: item.color, className: 'shrink-0' })
    );
    const active = i === 0;
    html += `
        <button class="py-2.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all select-none ${
          active ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60' : 'text-zinc-400 hover:text-white border border-transparent'
        }">
          ${svg}
          <span class="truncate">${item.label}</span>
        </button>
    `;
  });
  html += `
      </div>
    </div>
  `;
});

html += `
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_tab_icons.html', html);
console.log('Saved scratch/test_tab_icons.html successfully!');
