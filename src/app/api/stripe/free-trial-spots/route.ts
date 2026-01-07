import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

const TOTAL_FREE_TRIAL_SPOTS = 10

export async function GET() {
  try {
    const adminDb = getAdminDb()

    // Count businesses with subscriptions (active, trialing, or past_due)
    const subscriptionsSnapshot = await adminDb
      .collection('businesses')
      .where('subscriptionStatus', 'in', ['active', 'trialing', 'past_due'])
      .get()

    const totalActiveSubscriptions = subscriptionsSnapshot.size
    const remainingSpots = Math.max(0, TOTAL_FREE_TRIAL_SPOTS - totalActiveSubscriptions)

    return NextResponse.json({
      totalSpots: TOTAL_FREE_TRIAL_SPOTS,
      remainingSpots,
      spotsUsed: totalActiveSubscriptions,
      hasSpotsAvailable: remainingSpots > 0,
    })
  } catch (error: any) {
    console.error('Error fetching free trial spots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch free trial spots' },
      { status: 500 }
    )
  }
}
