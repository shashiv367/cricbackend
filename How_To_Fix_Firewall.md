# 🔥 How to Fix the Firewall

You have two options to run this fix on your server.

## Option 1: Quick Copy-Paste (Recommended)

Since you are already logged into the server (or can log in easily), just copy and paste these commands into your terminal:

```bash
# Allow SSH first so you don't get locked out
sudo ufw allow 22/tcp

# Allow web traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow your app
sudo ufw allow 3000/tcp

# Enable the firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

## Option 2: Run the Script

If you want to use the script I created (`backend/server-firewall-fix.sh`), you need to copy it to the server first.

1.  **On your local machine (Windows)**, run this to copy the file:
    ```powershell
    scp backend/server-firewall-fix.sh grahmindubuntu@103.233.73.55:~/
    ```

2.  **On the server**, run these commands:
    ```bash
    chmod +x server-firewall-fix.sh
    ./server-firewall-fix.sh
    ```
