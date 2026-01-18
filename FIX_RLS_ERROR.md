# 🔐 Fixing the RLS Error

The error `new row violates row-level security policy` happens because your backend is using the **Wrong Key**.

It is currently acting like a "guest" (Anon Key), which is not allowed to create profiles. It needs to act as the "Admin" (Service Role Key).

## 1. Get the Correct Key
1.  Go to your **Supabase Dashboard**.
2.  Click **Project Settings** (Cog icon) -> **API**.
3.  Look for `service_role` (secret).
4.  **COPY** that key. (It usually starts with `eyJ...` just like the anon key, but it is different!).

> **⚠️ WARNING:** Do NOT use the `anon` / `public` key. You MUST use the `service_role` key.

## 2. Update Server
Run these commands to update the key on your server:

```bash
# 1. SSH into server
ssh grahmindubuntu@103.233.73.55

# 2. Edit environment file
nano /opt/cricapp/.env.production
```

**In the file:**
Find the line `SUPABASE_SERVICE_ROLE_KEY` and delete the old value. Paste the **NEW Service Role Key** you copied.

Save and exit: `Ctrl+X` -> `Y` -> `Enter`.

## 3. Restart
Apply the changes:

```bash
cd /opt/cricapp
./deploy.sh
```

Try signing up again in the app. It should work instantly!
