# 🤗 Deploying CodeMind AI on Hugging Face Spaces (Free Unlimited Hosting)

Hugging Face Spaces provides **Free Unlimited Hosting** for Docker containerized web applications.

---

## 📋 Step-by-Step Hugging Face Spaces Deployment

### Step 1: Create a New Space on Hugging Face
1. Log in to [Hugging Face](https://huggingface.co).
2. Click your profile avatar $\rightarrow$ Click **New Space**.
3. Enter Space Details:
   - **Space Name**: `codemind-ai`
   - **License**: `mit` (or private)
   - **Select Space SDK**: Choose **Docker** 🐳.
   - **Choose a Docker Template**: Select **Blank**.
   - **Space Hardware**: Free CPU (2 vCPU, 16 GB RAM).
4. Click **Create Space**.

---

### Step 2: Push Your Codebase to Hugging Face
Clone your new Hugging Face Space repository:

```bash
git clone https://huggingface.co/spaces/YOUR_USERNAME/codemind-ai
cd codemind-ai
```

Copy your CodeMind AI project files into the Space repository directory, including `Dockerfile.huggingface`.

Rename `Dockerfile.huggingface` to `Dockerfile` inside the Hugging Face repo:

```bash
cp Dockerfile.huggingface Dockerfile
```

---

### Step 3: Add Environment Secrets (Groq API Key)
1. In your Hugging Face Space, click **Settings** $\rightarrow$ **Variables and Secrets**.
2. Click **New secret**:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `<YOUR_GROQ_API_KEY>`
3. Click **Save**.

---

### Step 4: Commit & Deploy
Commit and push to Hugging Face:

```bash
git add .
git commit -m "Deploy CodeMind AI on Hugging Face Spaces"
git push
```

---

### 🟢 Result
Hugging Face will build your Docker image and launch **CodeMind AI** live on a public URL:

```text
https://huggingface.co/spaces/YOUR_USERNAME/codemind-ai
```
or direct web app link:
```text
https://YOUR_USERNAME-codemind-ai.hf.space
```
