import os
import main
from ai_engine import ai_engine

prompt = 'add dark mode and light mode toggle button'
files = [
    {'path': 'index.html', 'code': '<!DOCTYPE html><html><head><title>Simple Site</title><link rel="stylesheet" href="styles.css"></head><body><h1>Welcome</h1><p>This is my site.</p></body></html>', 'lines': 1},
    {'path': 'styles.css', 'code': 'body { background: white; color: black; font-family: sans-serif; }', 'lines': 1}
]
proj_info = {'id': 'test_html', 'name': 'Simple Html Website', 'primary_language': 'HTML', 'framework': 'HTML5'}

print('TESTING GROQ AUTONOMOUS BRAIN...')
groq_result = ai_engine.autonomous_repository_transform(prompt, files, proj_info)
if groq_result:
    print('GROQ RESULT SUCCESSFUL!')
    print('MODEL USED:', groq_result.get('model_used'))
    print('REASONING:', groq_result.get('reasoning'))
    print('CREATED FILES:', [c.get('path') for c in groq_result.get('created_files', [])])
    print('MODIFIED FILES:', [m.get('path') for m in groq_result.get('modified_files', [])])
else:
    print('GROQ RETURNED NONE!')
