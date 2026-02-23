# Setting Up Custom Domain: Aurora.app

## Important Notes

1. **Domain Purchase Required**: You must first purchase/register the domain `aurora.app` (or `Aurora.app` - domains are case-insensitive). The `.app` domain is managed by Google Registry and may require purchase through:
   - Google Domains
   - Namecheap
   - GoDaddy
   - Other domain registrars

2. **No Code Changes Needed**: Your codebase uses relative URLs (`/api/...`), so it will automatically work with any domain once configured.

## Steps to Configure Custom Domain in Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com) and log in
   - Select your project (`marwan-project`)

2. **Navigate to Domain Settings**
   - Go to **Settings** → **Domains**
   - Or click on the **Domains** tab in your project

3. **Add Custom Domain**
   - Click **Add Domain** or **Add** button
   - Enter your domain: `aurora.app` (without `https://` or `www`)
   - Click **Add**

4. **Configure DNS**
   Vercel will provide DNS records. You need to add these to your domain registrar:

   **For apex domain (aurora.app):**
   - Type: `A` or `ALIAS` or `CNAME`
   - Name: `@` or leave blank
   - Value: Vercel will provide (e.g., `76.76.21.21` or a CNAME record)

   **For www subdomain (www.aurora.app) - Optional:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com.`

   **Example DNS Configuration:**
   ```
   Type    Name    Value
   A       @       76.76.21.21
   CNAME   www     cname.vercel-dns.com.
   ```

5. **Wait for DNS Propagation**
   - DNS changes can take 24-48 hours to propagate
   - Vercel will show the domain status (Pending → Valid Configuration → Ready)
   - You can check status in the Vercel dashboard

6. **SSL Certificate**
   - Vercel automatically provisions SSL certificates for your domain
   - This is free and automatic once DNS is configured

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add domain to your project
vercel domains add aurora.app

# Follow the prompts to configure DNS
```

## After Configuration

Once DNS is configured and verified:

1. Your site will be accessible at:
   - `https://aurora.app` (primary)
   - `https://www.aurora.app` (if configured)
   - `https://marwan-project.vercel.app` (will still work as a fallback)

2. **Optional: Redirect old domain**
   - In Vercel settings, you can set `marwan-project.vercel.app` to redirect to `aurora.app`
   - Go to Settings → Domains → Click on `marwan-project.vercel.app` → Add redirect

3. **Update Environment Variables (if any)**
   - If you have `FRONTEND_URL` environment variable, update it to `https://aurora.app`
   - Go to Settings → Environment Variables

## Troubleshooting

### Domain Status Shows "Invalid Configuration"
- Check that DNS records are correctly set at your domain registrar
- Ensure DNS records point to the values Vercel provided
- Wait for DNS propagation (can take up to 48 hours)

### SSL Certificate Not Working
- Vercel automatically provisions SSL certificates
- If issues persist, check DNS configuration is correct
- Contact Vercel support if problems continue

### Domain Not Resolving
- Verify DNS records are correct
- Use tools like `dig aurora.app` or `nslookup aurora.app` to check DNS
- Ensure you've waited for DNS propagation

## Additional Resources

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel DNS Configuration Guide](https://vercel.com/docs/concepts/projects/domains/add-a-domain)
