'use client'

import { db } from '@/lib/firebase/config'
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore'
import { AnalyticsEvent, AnalyticsEventType } from '@/lib/types'

// Generate a session ID for anonymous tracking
const getSessionId = (): string => {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('tlg_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('tlg_session_id', sessionId)
  }
  return sessionId
}

// Detect device type
const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Track an analytics event
export const trackEvent = async (
  businessId: string,
  eventType: AnalyticsEventType,
  options?: {
    userId?: string
    referrer?: string
    searchQuery?: string
    productId?: string
    serviceName?: string
  }
): Promise<void> => {
  if (!db) return

  try {
    const event: Omit<AnalyticsEvent, 'id'> = {
      businessId,
      eventType,
      timestamp: new Date(),
      sessionId: getSessionId(),
      deviceType: getDeviceType(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...options,
    }

    // Don't await - fire and forget for performance
    addDoc(collection(db, 'analyticsEvents'), {
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp),
    }).catch((err) => {
      console.warn('Analytics tracking failed:', err)
    })
  } catch (err) {
    console.warn('Analytics tracking error:', err)
  }
}

// Track page view with deduplication (only once per session)
export const trackPageView = async (
  businessId: string,
  userId?: string,
  referrer?: string
): Promise<void> => {
  if (typeof window === 'undefined') return

  // Check if we've already tracked this page view in this session
  const viewKey = `tlg_viewed_${businessId}`
  if (sessionStorage.getItem(viewKey)) return

  sessionStorage.setItem(viewKey, 'true')

  await trackEvent(businessId, 'page_view', {
    userId,
    referrer: referrer || document.referrer || undefined,
  })
}

// Track search appearance (when business shows in search results)
export const trackSearchAppearance = async (
  businessId: string,
  searchQuery?: string
): Promise<void> => {
  await trackEvent(businessId, 'search_appearance', { searchQuery })
}

// Fetch analytics data for a business
export interface AnalyticsData {
  // Today
  viewsToday: number
  clicksToday: number
  // This week
  viewsThisWeek: number
  clicksThisWeek: number
  appointmentsThisWeek: number
  // This month
  viewsThisMonth: number
  clicksThisMonth: number
  appointmentsThisMonth: number
  // Totals
  totalViews: number
  totalClicks: number
  totalAppointments: number
  totalFavorites: number
  // Breakdowns
  clicksByType: {
    phone: number
    email: number
    website: number
    map: number
  }
  // Trends (daily data for charts)
  dailyViews: Array<{ date: string; count: number }>
  dailyClicks: Array<{ date: string; count: number }>
  // Top referrers
  topReferrers: Array<{ source: string; count: number }>
  // Device breakdown
  deviceBreakdown: {
    mobile: number
    tablet: number
    desktop: number
  }
}

export const fetchBusinessAnalytics = async (
  businessId: string,
  daysBack: number = 30
): Promise<AnalyticsData> => {
  if (!db) {
    return getEmptyAnalytics()
  }

  try {
    const now = new Date()
    const startDate = new Date()
    startDate.setDate(now.getDate() - daysBack)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date()
    weekStart.setDate(now.getDate() - 7)

    // Fetch all events for this business in the date range
    const eventsQuery = query(
      collection(db, 'analyticsEvents'),
      where('businessId', '==', businessId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    )

    const snapshot = await getDocs(eventsQuery)
    const events = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as AnalyticsEvent[]

    // Also fetch favorites count
    const favoritesQuery = query(
      collection(db, 'favorites'),
      where('itemId', '==', businessId),
      where('itemType', '==', 'business')
    )
    const favoritesSnapshot = await getDocs(favoritesQuery)
    const totalFavorites = favoritesSnapshot.size

    // Also fetch appointments
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('businessId', '==', businessId)
    )
    const appointmentsSnapshot = await getDocs(appointmentsQuery)
    const appointments = appointmentsSnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }))

    // Calculate metrics
    const viewEvents = events.filter(e => e.eventType === 'page_view')
    const clickEvents = events.filter(e =>
      ['phone_click', 'email_click', 'website_click', 'map_click'].includes(e.eventType)
    )

    // Time-based filtering
    const viewsToday = viewEvents.filter(e => e.timestamp >= todayStart).length
    const viewsThisWeek = viewEvents.filter(e => e.timestamp >= weekStart).length
    const viewsThisMonth = viewEvents.length

    const clicksToday = clickEvents.filter(e => e.timestamp >= todayStart).length
    const clicksThisWeek = clickEvents.filter(e => e.timestamp >= weekStart).length
    const clicksThisMonth = clickEvents.length

    const appointmentsThisWeek = appointments.filter(a => a.createdAt >= weekStart).length
    const appointmentsThisMonth = appointments.filter(a => a.createdAt >= startDate).length

    // Click type breakdown
    const clicksByType = {
      phone: events.filter(e => e.eventType === 'phone_click').length,
      email: events.filter(e => e.eventType === 'email_click').length,
      website: events.filter(e => e.eventType === 'website_click').length,
      map: events.filter(e => e.eventType === 'map_click').length,
    }

    // Daily views for chart
    const dailyViewsMap = new Map<string, number>()
    const dailyClicksMap = new Map<string, number>()

    // Initialize all days
    for (let i = 0; i < daysBack; i++) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyViewsMap.set(dateStr, 0)
      dailyClicksMap.set(dateStr, 0)
    }

    viewEvents.forEach(e => {
      const dateStr = e.timestamp.toISOString().split('T')[0]
      dailyViewsMap.set(dateStr, (dailyViewsMap.get(dateStr) || 0) + 1)
    })

    clickEvents.forEach(e => {
      const dateStr = e.timestamp.toISOString().split('T')[0]
      dailyClicksMap.set(dateStr, (dailyClicksMap.get(dateStr) || 0) + 1)
    })

    const dailyViews = Array.from(dailyViewsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const dailyClicks = Array.from(dailyClicksMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Referrer breakdown
    const referrerMap = new Map<string, number>()
    viewEvents.forEach(e => {
      if (e.referrer) {
        try {
          const url = new URL(e.referrer)
          const source = url.hostname || 'Direct'
          referrerMap.set(source, (referrerMap.get(source) || 0) + 1)
        } catch {
          referrerMap.set('Direct', (referrerMap.get('Direct') || 0) + 1)
        }
      } else {
        referrerMap.set('Direct', (referrerMap.get('Direct') || 0) + 1)
      }
    })

    const topReferrers = Array.from(referrerMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Device breakdown
    const deviceBreakdown = {
      mobile: events.filter(e => e.deviceType === 'mobile').length,
      tablet: events.filter(e => e.deviceType === 'tablet').length,
      desktop: events.filter(e => e.deviceType === 'desktop').length,
    }

    return {
      viewsToday,
      clicksToday,
      viewsThisWeek,
      clicksThisWeek,
      appointmentsThisWeek,
      viewsThisMonth,
      clicksThisMonth,
      appointmentsThisMonth,
      totalViews: viewsThisMonth, // For period display
      totalClicks: clicksThisMonth,
      totalAppointments: appointments.length,
      totalFavorites,
      clicksByType,
      dailyViews,
      dailyClicks,
      topReferrers,
      deviceBreakdown,
    }
  } catch (err) {
    console.error('Error fetching analytics:', err)
    return getEmptyAnalytics()
  }
}

function getEmptyAnalytics(): AnalyticsData {
  return {
    viewsToday: 0,
    clicksToday: 0,
    viewsThisWeek: 0,
    clicksThisWeek: 0,
    appointmentsThisWeek: 0,
    viewsThisMonth: 0,
    clicksThisMonth: 0,
    appointmentsThisMonth: 0,
    totalViews: 0,
    totalClicks: 0,
    totalAppointments: 0,
    totalFavorites: 0,
    clicksByType: { phone: 0, email: 0, website: 0, map: 0 },
    dailyViews: [],
    dailyClicks: [],
    topReferrers: [],
    deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
  }
}
