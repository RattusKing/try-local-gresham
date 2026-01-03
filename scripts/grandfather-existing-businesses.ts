/**
 * Migration Script: Grandfather Existing Businesses
 *
 * This script marks existing approved businesses as "grandfathered" to exempt them
 * from subscription requirements. This protects existing businesses from being
 * disrupted when subscription enforcement is enabled.
 *
 * Safe to run multiple times - only affects businesses that:
 * 1. Are approved (status: 'approved')
 * 2. Don't have an active subscription
 * 3. Don't already have grandfathered flag set
 *
 * Usage:
 *   npx ts-node scripts/grandfather-existing-businesses.ts
 *
 * Or with Firebase Admin SDK:
 *   NODE_ENV=production npx ts-node scripts/grandfather-existing-businesses.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as path from 'path'
import * as fs from 'fs'

// Initialize Firebase Admin
if (!getApps().length) {
  // Try to load service account from environment or file
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '../serviceAccountKey.json')

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    initializeApp({
      credential: cert(serviceAccount)
    })
    console.log('✅ Firebase Admin initialized with service account')
  } else {
    // Fall back to default credentials (useful in Cloud environments)
    initializeApp()
    console.log('✅ Firebase Admin initialized with default credentials')
  }
}

const db = getFirestore()

interface Business {
  id: string
  status?: string
  subscriptionStatus?: string
  grandfathered?: boolean
  approvedAt?: any
  createdAt?: any
  name?: string
}

async function grandfatherExistingBusinesses() {
  console.log('🔍 Searching for businesses to grandfather...\n')

  try {
    // Get all businesses
    const businessesSnapshot = await db.collection('businesses').get()

    if (businessesSnapshot.empty) {
      console.log('ℹ️  No businesses found in the database')
      return
    }

    console.log(`📊 Found ${businessesSnapshot.size} total businesses\n`)

    const updates: Promise<any>[] = []
    let grandfatheredCount = 0
    let skippedCount = 0
    let alreadyGrandfatheredCount = 0
    let hasSubscriptionCount = 0

    for (const doc of businessesSnapshot.docs) {
      const business = { id: doc.id, ...doc.data() } as Business

      // Skip if already grandfathered
      if (business.grandfathered === true) {
        console.log(`⏭️  ${business.name || business.id}: Already grandfathered`)
        alreadyGrandfatheredCount++
        continue
      }

      // Skip if not approved
      if (business.status !== 'approved') {
        console.log(`⏭️  ${business.name || business.id}: Not approved (status: ${business.status})`)
        skippedCount++
        continue
      }

      // Skip if has active subscription
      if (business.subscriptionStatus === 'active' || business.subscriptionStatus === 'trialing') {
        console.log(`⏭️  ${business.name || business.id}: Has active subscription`)
        hasSubscriptionCount++
        continue
      }

      // This business should be grandfathered!
      console.log(`✨ Grandfathering: ${business.name || business.id}`)
      console.log(`   - Status: ${business.status}`)
      console.log(`   - Subscription: ${business.subscriptionStatus || 'none'}`)
      console.log(`   - Created: ${business.createdAt?.toDate?.() || 'unknown'}`)

      grandfatheredCount++

      // Update the business
      const updateData: any = {
        grandfathered: true,
        updatedAt: new Date()
      }

      // If no approvedAt timestamp, set one based on createdAt or current time
      if (!business.approvedAt) {
        updateData.approvedAt = business.createdAt || new Date()
        console.log(`   - Setting approvedAt: ${updateData.approvedAt.toDate?.() || updateData.approvedAt}`)
      }

      updates.push(
        db.collection('businesses').doc(business.id).update(updateData)
      )

      console.log('') // Empty line for readability
    }

    // Execute all updates
    if (updates.length > 0) {
      console.log(`\n🚀 Executing ${updates.length} updates...`)
      await Promise.all(updates)
      console.log('✅ All updates completed successfully!\n')
    }

    // Summary
    console.log('=' .repeat(60))
    console.log('📋 MIGRATION SUMMARY')
    console.log('=' .repeat(60))
    console.log(`✨ Grandfathered:          ${grandfatheredCount}`)
    console.log(`✅ Already grandfathered:  ${alreadyGrandfatheredCount}`)
    console.log(`💳 Has subscription:       ${hasSubscriptionCount}`)
    console.log(`⏭️  Skipped (not approved): ${skippedCount}`)
    console.log(`📊 Total businesses:       ${businessesSnapshot.size}`)
    console.log('=' .repeat(60))

    if (grandfatheredCount > 0) {
      console.log('\n🎉 Success! Existing businesses are now protected from subscription enforcement.')
      console.log('   They can continue using the platform without subscribing.')
    } else {
      console.log('\nℹ️  No businesses needed to be grandfathered.')
    }

  } catch (error) {
    console.error('❌ Error during migration:', error)
    throw error
  }
}

// Run the migration
grandfatherExistingBusinesses()
  .then(() => {
    console.log('\n✅ Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
