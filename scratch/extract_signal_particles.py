with open(r'C:\Users\aditya\.gemini\antigravity-ide\brain\c7bd977b-9d1c-4e63-ada7-01cf1529cfa7\.system_generated\steps\761\content.md', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('signalParticles')
print('signalParticles at:', idx)
print('Context around signalParticles:')
print(text[idx-500:idx+800])

# Find 'const te' before idx
te_idx = text.rfind('te=`', 0, idx)
if te_idx == -1:
    te_idx = text.rfind('te = `', 0, idx)
if te_idx == -1:
    te_idx = text.rfind('te=', 0, idx)

print('te_idx:', te_idx)
if te_idx != -1:
    # Find backtick start and end
    b_start = text.find('`', te_idx)
    b_end = text.find('`', b_start + 1)
    # Be careful with escaped backticks inside template string
    cur = b_start + 1
    while cur < len(text):
        if text[cur] == '`' and text[cur-1] != '\\':
            b_end = cur
            break
        cur += 1
    
    html = text[b_start+1:b_end]
    print('HTML length:', len(html))
    with open(r'C:\Users\aditya\.gemini\antigravity-ide\scratch\codemind-ai-main\signal_particles_exact.html', 'w', encoding='utf-8') as out:
        out.write(html)
    print('Wrote signal_particles_exact.html!')
    print('Preview:')
    print(html[:1500])
