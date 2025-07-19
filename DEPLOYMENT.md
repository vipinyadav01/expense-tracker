# 🚀 Cloudflare Pages Deployment Guide

This guide will help you deploy your Expense Tracker app to Cloudflare Pages.

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)
3. **Environment Variables**: Prepare your environment variables

## 🔧 Environment Variables Setup

Before deploying, you need to set up these environment variables in Cloudflare:

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### How to Get These Values

1. **Supabase**: Go to your Supabase project dashboard → Settings → API
2. **Clerk**: Go to your Clerk dashboard → API Keys
3. **Google Gemini**: Go to Google AI Studio → Get API Key

## 🚀 Deployment Steps

### Method 1: Cloudflare Dashboard (Recommended)

1. **Connect Repository**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to "Pages" → "Create a project"
   - Choose "Connect to Git"
   - Select your repository

2. **Configure Build Settings**
   ```
   Project name: expense-tracker
   Production branch: main (or your default branch)
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: out
   Root directory: / (leave empty if root)
   ```

3. **Set Environment Variables**
   - In the build settings, go to "Environment variables"
   - Add all the required environment variables listed above
   - Set them for "Production" and "Preview" environments

4. **Deploy**
   - Click "Save and Deploy"
   - Wait for the build to complete
   - Your app will be available at `https://your-project-name.pages.dev`

### Method 2: Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Set Environment Variables**
   ```bash
   wrangler secret put NEXT_PUBLIC_SUPABASE_URL
   wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
   wrangler secret put NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   wrangler secret put NEXT_PUBLIC_GEMINI_API_KEY
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

## 🔧 Configuration Files

### `next.config.mjs`
- Configured for static export
- Environment variables properly set
- Optimized for Cloudflare Pages

### `_redirects`
- Handles client-side routing
- Redirects API calls if needed
- Static asset handling

### `wrangler.toml`
- Cloudflare Pages configuration
- Build settings
- Environment setup

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check environment variables are set correctly
   - Ensure all dependencies are in `package.json`
   - Check build logs in Cloudflare dashboard

2. **Environment Variables Not Working**
   - Verify variables are set for both "Production" and "Preview"
   - Check variable names match exactly (case-sensitive)
   - Restart build after adding variables

3. **Routing Issues**
   - Ensure `_redirects` file is in the build output
   - Check that `trailingSlash: true` is set in `next.config.mjs`

4. **API Routes Not Working**
   - Cloudflare Pages is static hosting
   - API routes need to be converted to Cloudflare Workers
   - Consider using Supabase Edge Functions instead

### Build Optimization

1. **Reduce Bundle Size**
   ```bash
   npm run build --analyze
   ```

2. **Check Dependencies**
   ```bash
   npm audit
   npm outdated
   ```

## 🔄 Continuous Deployment

### Automatic Deployments
- Cloudflare Pages automatically deploys on every push to your main branch
- Preview deployments are created for pull requests
- You can configure custom domains in the dashboard

### Custom Domain Setup
1. Go to your project in Cloudflare Pages
2. Navigate to "Custom domains"
3. Add your domain
4. Update DNS records as instructed

## 📊 Monitoring

### Performance Monitoring
- Use Cloudflare Analytics (built-in)
- Monitor Core Web Vitals
- Check build times and success rates

### Error Tracking
- Set up error monitoring (e.g., Sentry)
- Monitor API response times
- Check user experience metrics

## 🔒 Security

### Environment Variables
- Never commit sensitive keys to Git
- Use Cloudflare's secret management
- Rotate keys regularly

### CORS Configuration
- Configure Supabase CORS settings
- Add your Cloudflare domain to allowed origins
- Test authentication flows

## 📱 Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Authentication is working
- [ ] Database connections are successful
- [ ] AI insights are generating
- [ ] All pages are accessible
- [ ] Mobile responsiveness is working
- [ ] Performance is acceptable
- [ ] Custom domain is configured (if needed)
- [ ] SSL certificate is active
- [ ] Analytics are tracking correctly

## 🆘 Support

If you encounter issues:

1. Check Cloudflare Pages documentation
2. Review build logs in the dashboard
3. Verify environment variables
4. Test locally with `npm run build`
5. Check browser console for errors

## 🔗 Useful Links

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Static Export](https://nextjs.org/docs/advanced-features/static-html-export)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)

---

**Note**: This deployment guide assumes you're using the static export feature of Next.js. If you need server-side features, consider using Cloudflare Workers or other serverless platforms. 