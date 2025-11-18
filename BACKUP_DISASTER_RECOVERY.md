# Backup and Disaster Recovery Plan

Comprehensive backup strategy and disaster recovery procedures for Try Local Gresham.

## Executive Summary

**Recovery Time Objective (RTO)**: < 4 hours
**Recovery Point Objective (RPO)**: < 1 hour
**Backup Frequency**: Daily automated + continuous for critical data
**Data Retention**: 30 days

---

## Data Inventory

### Critical Data (Must Never Lose)

1. **Firestore Database** (Firebase)
   - Users, businesses, orders, appointments
   - Reviews, products, services
   - Business applications

2. **Firebase Storage** (Images/Files)
   - Business logos and photos
   - Product images
   - User profile pictures

3. **Environment Variables** (Vercel/Firebase)
   - API keys and secrets
   - Configuration values

### Non-Critical Data (Recoverable)

1. **Application Code** (GitHub)
   - Automatically backed up via Git
   - Multiple redundant copies

2. **Dependencies** (npm/package.json)
   - Reproducible from package.json

3. **Build Artifacts** (Vercel)
   - Regenerated on deployment

---

## Backup Strategy

### 1. Firestore Database Backups

#### Automated Daily Backups (Recommended)

**Setup via Firebase Console**:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Firestore Database** → **Backups** tab
4. Click **Set up automated backups**
5. Configure:
   - **Frequency**: Daily at 2:00 AM UTC
   - **Retention**: 30 days
   - **Location**: Same region as database
   - **Backup name**: `daily-backup-{DATE}`
6. Click **Create**

**Cost**: ~$0.02/GB/month (very cheap)

**Verification**:
```bash
# List backups
gcloud firestore backups list --location=us-central1

# Expected output:
# NAME                        LOCATION      DATABASE  STATE
# daily-backup-2025-01-15    us-central1   (default) READY
```

#### Manual Backup (On-Demand)

**Via Firebase CLI**:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create manual backup
firebase firestore:backup --project your-project-id

# Backup to specific location
firebase firestore:backup gs://your-bucket-name/backups/manual-backup-$(date +%Y%m%d)
```

**Via Google Cloud Console**:
1. Go to [Cloud Console Firestore](https://console.cloud.google.com/firestore)
2. Click **Import/Export**
3. Click **Export**
4. Select collections (or **Select all**)
5. Choose GCS bucket
6. Click **Export**

#### Export to JSON (Local Backup)

```bash
# Using firestore-export npm package
npx firestore-export \
  --accountCredentials serviceAccount.json \
  --backupFile ./backups/firestore-$(date +%Y%m%d).json
```

### 2. Firebase Storage Backups

**Automated Sync to External Storage**:

```bash
# Using gsutil to sync to another bucket
gsutil -m rsync -r -d \
  gs://your-project.appspot.com \
  gs://your-backup-bucket/storage-backup-$(date +%Y%m%d)
```

**Schedule with Cloud Scheduler** (Recommended):
1. Create Cloud Storage backup bucket
2. Set up Cloud Scheduler job:
   ```bash
   gcloud scheduler jobs create http firestore-storage-backup \
     --schedule="0 3 * * *" \
     --uri="https://REGION-PROJECT.cloudfunctions.net/backupStorage" \
     --http-method=POST
   ```

**Manual Download** (Emergency):
```bash
# Download all files
gsutil -m cp -r gs://your-project.appspot.com ./local-backup/
```

### 3. Environment Variables Backup

**Critical - Store Securely!**

Create encrypted backup file:
```bash
# Export from Vercel
vercel env pull .env.production

# Encrypt and store securely
gpg --symmetric --cipher-algo AES256 .env.production
# Creates .env.production.gpg

# Store in:
# 1. Password manager (1Password, LastPass)
# 2. Encrypted cloud storage (not GitHub!)
# 3. Physical secure location
```

**Document in secure location**:
- Firebase API keys
- Resend API key
- Google Analytics ID
- Sentry DSN
- Vercel tokens
- KV Redis credentials

### 4. Code Backup (GitHub)

**Already Automatic** ✅
- Every commit backed up to GitHub
- Protected main branch
- Multiple contributors have clones

**Additional Protection**:
```bash
# Create release tags for major versions
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0

# Clone to external location monthly
git clone https://github.com/RattusKing/try-local-gresham.git \
  ../backups/code-backup-$(date +%Y%m%d)
```

---

## Disaster Recovery Procedures

### Scenario 1: Complete Firebase Project Loss

**Impact**: Database and storage completely unavailable
**RTO**: 4 hours
**RPO**: Last daily backup (max 24 hours)

**Recovery Steps**:

1. **Create New Firebase Project** (30 min)
   ```bash
   # Via Firebase Console
   # 1. Create new project
   # 2. Enable Firestore
   # 3. Enable Storage
   # 4. Set up authentication
   ```

2. **Restore Firestore Data** (1-2 hours)
   ```bash
   # Via Google Cloud Console
   # 1. Go to Firestore → Import/Export
   # 2. Click "Import"
   # 3. Select most recent backup
   # 4. Choose destination (new project)
   # 5. Click "Import"

   # Or via CLI:
   gcloud firestore import gs://backup-bucket/latest-backup \
     --project=new-project-id
   ```

3. **Restore Storage Files** (1 hour)
   ```bash
   # Copy from backup bucket
   gsutil -m cp -r \
     gs://backup-bucket/storage-backup-latest/* \
     gs://new-project.appspot.com/
   ```

4. **Update Environment Variables** (30 min)
   ```bash
   # Decrypt backup
   gpg .env.production.gpg

   # Update Firebase config in Vercel:
   # - NEXT_PUBLIC_FIREBASE_API_KEY
   # - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   # - NEXT_PUBLIC_FIREBASE_PROJECT_ID
   # - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   # - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   # - NEXT_PUBLIC_FIREBASE_APP_ID
   ```

5. **Redeploy Application** (30 min)
   ```bash
   git push origin main
   # Or trigger manual deployment in Vercel
   ```

6. **Verify Recovery** (30 min)
   - Test user login
   - Verify business data
   - Check image loading
   - Test order creation
   - Confirm all features work

**Total Time**: ~4 hours

### Scenario 2: Partial Data Loss (Specific Collection)

**Impact**: Single Firestore collection corrupted/deleted
**RTO**: 1 hour
**RPO**: Last backup

**Recovery Steps**:

1. **Identify Affected Collection**
   ```bash
   # Check which collections are missing/corrupted
   firebase firestore:get users --limit 1
   ```

2. **Restore Specific Collection**
   ```bash
   # Export specific collection from backup
   gcloud firestore export gs://backup-bucket/temp-restore \
     --collection-ids=users \
     --project=backup-project

   # Import to production
   gcloud firestore import gs://backup-bucket/temp-restore \
     --collection-ids=users \
     --project=production-project
   ```

3. **Verify Data**
   - Check record counts
   - Verify recent entries
   - Test affected features

**Total Time**: ~1 hour

### Scenario 3: Accidental Data Deletion

**Impact**: Important records deleted by mistake
**RTO**: < 30 minutes
**RPO**: Last backup (max 24 hours)

**Recovery Steps**:

1. **Stop Further Damage**
   - Immediately revoke admin access if compromised
   - Disable affected API routes if needed

2. **Identify Deleted Data**
   ```bash
   # Check Firestore audit logs (if enabled)
   gcloud logging read "resource.type=datastore_database" \
     --limit 50 \
     --format json
   ```

3. **Restore from Backup**
   - Option A: Restore entire collection (if many records deleted)
   - Option B: Manually restore specific documents

   ```bash
   # Manual document restore example
   firebase firestore:set users/USER_ID \
     --data backup-data.json
   ```

**Total Time**: 15-30 minutes

### Scenario 4: Vercel Account Compromise

**Impact**: Application deployment compromised
**RTO**: 2 hours
**RPO**: Last git commit

**Recovery Steps**:

1. **Secure Account**
   - Reset Vercel password
   - Enable 2FA
   - Revoke API tokens
   - Check access logs

2. **Redeploy from Source**
   ```bash
   # From clean git clone
   git clone https://github.com/RattusKing/try-local-gresham.git
   cd try-local-gresham

   # Deploy to new Vercel project if needed
   vercel --prod
   ```

3. **Verify No Malicious Code**
   ```bash
   # Check recent commits
   git log --since="7 days ago" --all --oneline

   # Diff against known good version
   git diff v1.0.0..HEAD
   ```

**Total Time**: ~2 hours

### Scenario 5: Complete Infrastructure Loss

**Impact**: Everything down (Vercel + Firebase + GitHub)
**RTO**: 8 hours (worst case)
**RPO**: Last backup

**Recovery Steps** (assuming you have local backups):

1. **Set Up New Firebase Project** (1 hour)
2. **Set Up New Vercel Account** (30 min)
3. **Restore Code from Local** (30 min)
4. **Restore Firestore Data** (2 hours)
5. **Restore Storage Files** (2 hours)
6. **Configure & Deploy** (1 hour)
7. **Update DNS** (1 hour)

**Total Time**: ~8 hours

---

## Testing Recovery

### Monthly Disaster Recovery Drill

**Purpose**: Verify backups work and team knows procedures

**Test Procedure** (30 minutes):

1. **Create Test Firebase Project**
   - Name: `try-local-gresham-dr-test`

2. **Restore Latest Backup**
   - Use last night's automated backup
   - Restore to test project

3. **Verify Data Integrity**
   ```bash
   # Count documents
   firebase firestore:get users --limit 1000 | wc -l
   # Should match production counts
   ```

4. **Document Results**
   - Backup age: X hours
   - Restoration time: Y minutes
   - Data integrity: Pass/Fail
   - Issues found: List

5. **Clean Up**
   - Delete test project
   - Document lessons learned

### Quarterly Full Recovery Test

Test complete disaster recovery:
- New Firebase project
- New Vercel deployment
- Full data restoration
- Application verification

**Schedule**: First Saturday of each quarter

---

## Monitoring & Alerts

### Backup Monitoring

**Set Up Alerts**:

1. **Backup Failure Alert**
   ```bash
   # Cloud Monitoring alert
   # Trigger: Firestore backup fails
   # Notification: Email + Slack
   ```

2. **Backup Size Alert**
   ```bash
   # Trigger: Backup size decreases >20%
   # May indicate data loss
   ```

3. **Missing Backup Alert**
   ```bash
   # Trigger: No backup in 48 hours
   # Immediate investigation required
   ```

### Health Checks

**Daily Automated Checks**:
```bash
# Check latest backup exists
gcloud firestore backups list --limit 1

# Verify backup size reasonable
# Alert if < expected size
```

---

## Backup Retention Policy

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Firestore Automated | Daily | 30 days | Firebase/GCS |
| Firestore Manual | On-demand | 90 days | Local + GCS |
| Storage Files | Daily | 30 days | GCS |
| Environment Variables | On-change | Forever | Encrypted storage |
| Code | Every commit | Forever | GitHub |
| Database exports | Weekly | 60 days | Local + cloud |

---

## Security & Access

### Backup Access Control

- ✅ Only admins can access backups
- ✅ Backups encrypted at rest
- ✅ Backup storage has MFA enabled
- ✅ Audit logs enabled for backup access
- ✅ No public access to backup buckets

### Restoration Access

**Who Can Restore**:
- Primary: Lead developer
- Secondary: Tech lead
- Emergency: Business owner (with training)

**Approval Required**:
- Production restores require 2-person approval
- Test restores can be done solo

---

## Costs

### Monthly Backup Costs (Estimated)

| Service | Size | Cost |
|---------|------|------|
| Firestore backups | 5 GB × 30 days | ~$3/month |
| Storage backups | 20 GB × 30 days | ~$10/month |
| GCS egress (restores) | Minimal | ~$1/month |
| **Total** | | **~$14/month** |

**Worth it?** YES! Much cheaper than losing customer data.

---

## Emergency Contacts

### Critical Issues (Data Loss)

1. **Technical Lead**: [Your Name/Email]
2. **Firebase Support**: firebase-support@google.com
3. **Vercel Support**: support@vercel.com

### Backup Locations

- **Firestore backups**: `gs://project-backups/firestore/`
- **Storage backups**: `gs://project-backups/storage/`
- **Environment backups**: [Secure location]
- **Code**: https://github.com/RattusKing/try-local-gresham

---

## Summary Checklist

Before going to production, ensure:

- [ ] Automated Firestore backups enabled (daily)
- [ ] Firebase Storage backup strategy in place
- [ ] Environment variables documented and encrypted
- [ ] GitHub repository has protected main branch
- [ ] Disaster recovery procedures documented
- [ ] Monthly backup testing scheduled
- [ ] Backup monitoring alerts configured
- [ ] Team trained on recovery procedures
- [ ] Emergency contact list updated
- [ ] Test restoration performed successfully

---

## Quick Reference Card

**Emergency? Follow this:**

1. **Stay Calm** ✋
2. **Assess Impact**: What's lost?
3. **Stop Further Damage**: Revoke access if needed
4. **Check Last Backup**: When was it?
5. **Follow Scenario Guide**: See above
6. **Notify Stakeholders**: Keep them informed
7. **Document Everything**: For post-mortem
8. **Test Before Going Live**: Verify restoration
9. **Update Procedures**: Learn from incident

**Remember**: Backups are only useful if you can restore them. Test regularly!

---

*Last Updated: 2025-01-18*
*Next Review: 2025-04-18*
