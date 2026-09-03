import zipfile
import io
import urllib.request

buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w') as z:
    z.writestr('main.py', 'def test(): print("hello")')

zip_bytes = buf.getvalue()

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = bytearray()
body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="file"; filename="test.zip"\r\n')
body.extend(b'Content-Type: application/zip\r\n\r\n')
body.extend(zip_bytes)
body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/projects/upload',
    data=bytes(body),
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    with urllib.request.urlopen(req) as resp:
        print("Success:", resp.status, resp.read().decode()[:200])
except Exception as e:
    print("Error:", e)
