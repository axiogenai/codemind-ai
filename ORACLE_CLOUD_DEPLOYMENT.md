# ☁️ Deploying CodeMind AI on Oracle Cloud Infrastructure (OCI Always Free Tier)

Oracle Cloud Infrastructure (OCI) provides an **Always Free Tier** featuring up to **4 OCPUs and 24 GB RAM** (Ampere A1 ARM Compute) or AMD Micro instances completely free forever.

---

## 📋 Step-by-Step Oracle Cloud Deployment

### Step 1: Create an Always Free Instance on Oracle Cloud
1. Log in to [Oracle Cloud Console](https://cloud.oracle.com).
2. Go to **Compute** $\rightarrow$ **Instances** $\rightarrow$ Click **Create Instance**.
3. Select OS: **Ubuntu 22.04 LTS**.
4. Select Shape:
   - **Ampere A1 ARM**: Up to 4 OCPUs & 24 GB RAM (Recommended, 100% Always Free).
   - Or **AMD VM.Standard.E2.1.Micro** (Always Free).
5. Add your SSH Public Key and click **Create**.

---

### Step 2: Open Ingress Ports in Oracle Cloud VCN Security List
Oracle Cloud instances block all incoming HTTP/HTTPS traffic by default in the Virtual Cloud Network (VCN):

1. On your instance page, click your **Subnet** $\rightarrow$ Click **Security Lists** (e.g. `Default Security List`).
2. Click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `80, 443, 8000`
3. Click **Add Ingress Rules**.

---

### Step 3: Configure Ubuntu Firewall (`iptables`) on Oracle Instance
Connect to your Oracle instance via SSH:

```bash
ssh -i /path/to/ssh-key.key ubuntu@YOUR_ORACLE_INSTANCE_IP
```

Oracle's Ubuntu image includes restrictive default `iptables` rules. Run these commands to open ports:

```bash
# Allow HTTP, HTTPS, and API ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT

# Save iptables rules across reboots
sudo netfilter-persistent save
```

---

### Step 4: Install Docker & Docker Compose
Run the following commands on your Oracle Cloud VM:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose git
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

---

### Step 5: Deploy CodeMind AI in 1 Command
Clone your codebase and launch the multi-container production stack:

```bash
git clone https://github.com/your-username/codemind-ai.git
cd codemind-ai
docker-compose up -d --build
```

---

### Step 6: Verify Your Live Oracle Deployment
Open your web browser and visit:

```text
http://YOUR_ORACLE_INSTANCE_IP/
```

- 🟢 **Frontend App**: Served via Nginx container on Port `80`.
- 🟢 **FastAPI Backend**: Running containerized on Port `8000` with Groq Llama 3.3 70B & GNN engines.
