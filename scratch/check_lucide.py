import html
# Let's inspect the SVG paths from lucide for our candidates
import subprocess
import json

code = """
const lucide = require('lucide-react');
const icons = ['FolderGit2', 'PackageOpen', 'Radar', 'HardDrive', 'Boxes', 'Waypoints', 'Terminal', 'Archive', 'Compass', 'FolderCode', 'ScanSearch'];
const res = {};
icons.forEach(name => {
  const icon = lucide[name];
  // Lucide icons have render functions with SVG definitions
  res[name] = true;
});
console.log(JSON.stringify(res));
"""
subprocess.run(['node', '-e', code], cwd=r'C:\Users\aditya\.gemini\antigravity-ide\scratch\codemind-ai-main\frontend')
