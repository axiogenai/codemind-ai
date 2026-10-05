with open('signal_particles_exact.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
norm = html.replace(r'<\/script>', '</script>')
scripts = re.findall(r'<script.*?>([\s\S]*?)</script>', norm, re.I)
s = scripts[4]
c_idx = s.find('// Canvas Background Logic')
print(s[c_idx:])
