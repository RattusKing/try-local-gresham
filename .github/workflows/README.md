# GitHub Actions Workflows

This directory contains CI/CD workflows for automated testing, building, and deployment.

## Workflows

### 1. CI (`ci.yml`)
Runs on every pull request and push to main.

**Jobs:**
- **Lint**: ESLint code quality checks
- **Test**: Runs all unit and integration tests with coverage
- **Build**: Verifies the application builds successfully
- **Type Check**: TypeScript type validation
- **Security**: npm audit for vulnerabilities

**Required Secrets:** None (uses test environment variables)

### 2. Deploy (`deploy.yml`)
Deploys to production on merge to main, or manually via workflow_dispatch.

**Jobs:**
- **Deploy to Vercel**: Builds and deploys production app
- **Deploy Firebase Rules**: Deploys Firestore and Storage rules

**Required Secrets:**
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `FIREBASE_TOKEN`: Firebase CI token (`firebase login:ci`)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- All `NEXT_PUBLIC_*` environment variables
- `RESEND_API_KEY`: Email service API key
- `SENTRY_DSN`: Sentry error tracking DSN

### 3. PR Preview (`pr-preview.yml`)
Creates preview deployments for pull requests.

**Jobs:**
- **Deploy Preview**: Deploys PR to Vercel preview environment
- **Lighthouse CI**: Runs performance audits on preview

**Features:**
- Automatic preview URL comments on PRs
- Performance testing with Lighthouse
- Updates on each commit

**Required Secrets:** Same as Deploy workflow

## Setup Instructions

### 1. Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

```bash
# Vercel
VERCEL_TOKEN=<get from https://vercel.com/account/tokens>
VERCEL_ORG_ID=<from .vercel/project.json after running 'vercel link'>
VERCEL_PROJECT_ID=<from .vercel/project.json>

# Firebase
FIREBASE_TOKEN=<run 'firebase login:ci'>
FIREBASE_PROJECT_ID=<your-project-id>

# Environment Variables
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
NEXT_PUBLIC_APP_URL=https://your-domain.com
RESEND_API_KEY=<your-resend-api-key>
NEXT_PUBLIC_GA_MEASUREMENT_ID=<your-ga-id>
SENTRY_DSN=<your-sentry-dsn>
```

### 2. Enable Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Link your project
vercel link

# This creates .vercel/project.json with your ORG_ID and PROJECT_ID
```

### 3. Get Firebase Token

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and get CI token
firebase login:ci

# Copy the token to FIREBASE_TOKEN secret
```

### 4. Test Workflows Locally

```bash
# Install act (GitHub Actions local runner)
# macOS:
brew install act

# Linux:
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflows locally
act pull_request  # Test CI workflow
act push          # Test Deploy workflow
```

## Workflow Triggers

| Workflow | Trigger | When |
|----------|---------|------|
| CI | `pull_request`, `push` | Every PR and commit to main |
| Deploy | `push` to main, `workflow_dispatch` | Merges to main or manual trigger |
| PR Preview | `pull_request` (opened, sync, reopened) | New PRs and updates |

## Branch Protection Rules

Recommended branch protection for `main`:

1. Require pull request reviews before merging (1+ reviewers)
2. Require status checks to pass:
   - `Lint Code`
   - `Run Tests`
   - `Build Application`
   - `TypeScript Type Check`
3. Require branches to be up to date before merging
4. Include administrators

## Monitoring

- **Test Coverage**: Uploaded to Codecov (optional, requires Codecov account)
- **Build Status**: Visible in PR checks
- **Preview URLs**: Posted as PR comments
- **Lighthouse Scores**: Performance metrics on previews

## Troubleshooting

### Build fails with environment variable errors

Make sure all `NEXT_PUBLIC_*` secrets are set in GitHub repository settings.

### Firebase deployment fails

1. Verify `FIREBASE_TOKEN` is valid: `firebase projects:list --token "$FIREBASE_TOKEN"`
2. Check `FIREBASE_PROJECT_ID` matches your project
3. Ensure Firebase CLI version is up to date

### Vercel deployment fails

1. Check `VERCEL_TOKEN` is valid and not expired
2. Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from `.vercel/project.json`
3. Ensure Vercel account has proper permissions

### Tests fail in CI but pass locally

1. Check Node.js versions match (CI uses Node 20)
2. Use `npm ci` instead of `npm install` locally
3. Clear npm cache: `npm cache clean --force`

## Manual Deployment

Trigger manual deployment via GitHub UI:

1. Go to Actions tab
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"
