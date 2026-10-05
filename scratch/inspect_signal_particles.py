with open('signal_particles_exact.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
# normalize <\/script>
norm = html.replace(r'<\/script>', '</script>')
scripts = re.findall(r'<script.*?>([\s\S]*?)</script>', norm, re.I)
print('Number of scripts:', len(scripts))
for i, s in enumerate(scripts):
    print(f'=== SCRIPT {i} (len: {len(s)}) ===')
    if len(s) > 2000:
        print(s[:2000])
        print('... [truncated] ...')
        print(s[-500:])
    else:
        print(s)
