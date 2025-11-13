# Git & GitHub Setup Guide

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon → **"New repository"**
3. Repository name: `private-tutoring-v2` (or your preferred name)
4. Description: "Private Tutoring Dashboard Platform"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

## Step 2: Add GitHub Remote

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/private-tutoring-v2.git

# Or if you prefer SSH:
git remote add origin git@github.com:YOUR_USERNAME/private-tutoring-v2.git
```

## Step 3: Push to GitHub

```bash
# Push to GitHub
git push -u origin master

# If you get an error about branch name, try:
git push -u origin main
```

## Step 4: Verify

Check your GitHub repository - you should see all your files!

## Troubleshooting

### If you get "branch name" error:

GitHub uses `main` as default branch name, but your local might be `master`.

**Option 1: Rename local branch to main**
```bash
git branch -M main
git push -u origin main
```

**Option 2: Keep master and push**
```bash
git push -u origin master
```

### If you get authentication error:

**For HTTPS:**
- GitHub no longer accepts passwords
- Use a Personal Access Token:
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token with `repo` scope
  3. Use token as password when pushing

**For SSH:**
- Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## Quick Commands

```bash
# Check current remotes
git remote -v

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Remove remote (if wrong)
git remote remove origin

# Push to GitHub
git push -u origin master
# or
git push -u origin main
```

