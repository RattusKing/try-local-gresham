'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useEffect, useState, useCallback } from 'react'
import { fetchBusinessAnalytics, AnalyticsData } from '@/lib/analytics'
import { Appointment, Order } from '@/lib/types'
import './analytics.css'
import { logger } from '@/lib/logger';

export default function BusinessAnalytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')

  const loadAnalytics = useCallback(async () => {
    if (!user || !db) return

    try {
      setLoading(true)

      // Fetch analytics data
      const daysBack = parseInt(timeRange)
      const analyticsData = await fetchBusinessAnalytics(user.uid, daysBack)
      setAnalytics(analyticsData)

      // Fetch appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('businessId', '==', user.uid)
      )
      const appointmentsSnap = await getDocs(appointmentsQuery)
      const appointmentsList = appointmentsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Appointment[]

      // Sort by scheduled date descending
      appointmentsList.sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate} ${a.scheduledTime}`)
        const dateB = new Date(`${b.scheduledDate} ${b.scheduledTime}`)
        return dateB.getTime() - dateA.getTime()
      })
      setAppointments(appointmentsList.slice(0, 10))

      // Fetch orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('businessId', '==', user.uid)
      )
      const ordersSnap = await getDocs(ordersQuery)
      const ordersList = ordersSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Order[]

      ordersList.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
      setOrders(ordersList.slice(0, 10))

    } catch (err: unknown) {
      logger.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [user, timeRange])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const exportToCSV = () => {
    if (!analytics) return

    const csvData = [
      ['Metric', 'Value'],
      ['Profile Views (Period)', analytics.viewsThisMonth.toString()],
      ['Total Clicks (Period)', analytics.clicksThisMonth.toString()],
      ['Phone Clicks', analytics.clicksByType.phone.toString()],
      ['Email Clicks', analytics.clicksByType.email.toString()],
      ['Website Clicks', analytics.clicksByType.website.toString()],
      ['Map Clicks', analytics.clicksByType.map.toString()],
      ['Favorites', analytics.totalFavorites.toString()],
      ['Appointments', analytics.totalAppointments.toString()],
      [],
      ['Daily Views'],
      ['Date', 'Views'],
      ...analytics.dailyViews.map((d) => [d.date, d.count.toString()]),
    ]

    const csv = csvData.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="empty-state">
        <p>No analytics data available yet. Analytics will appear once customers start viewing your business page.</p>
      </div>
    )
  }

  const maxViews = Math.max(...analytics.dailyViews.map((d) => d.count), 1)

  // Calculate percentage changes (mock for now - would need historical data)
  const getViewsTrend = () => {
    if (analytics.viewsThisWeek === 0) return null
    return analytics.viewsToday > 0 ? 'up' : 'neutral'
  }

  return (
    <div className="business-dashboard">
      <div className="analytics-header">
        <h1>Analytics & Insights</h1>
        <div className="analytics-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7' | '30' | '90')}
            className="time-range-select"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button onClick={exportToCSV} className="btn-secondary">
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics - What Service Businesses Care About */}
      <div className="analytics-cards">
        <div className="analytics-card highlight">
          <div className="card-icon">👁️</div>
          <div className="card-content">
            <h3>Profile Views</h3>
            <p className="card-value">{analytics.viewsThisMonth}</p>
            <span className="card-label">
              {analytics.viewsToday} today · {analytics.viewsThisWeek} this week
            </span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📞</div>
          <div className="card-content">
            <h3>Contact Clicks</h3>
            <p className="card-value">{analytics.clicksThisMonth}</p>
            <span className="card-label">
              Phone, email, website & map clicks
            </span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Appointments</h3>
            <p className="card-value">{analytics.totalAppointments}</p>
            <span className="card-label">
              {analytics.appointmentsThisWeek} this week
            </span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">❤️</div>
          <div className="card-content">
            <h3>Favorites</h3>
            <p className="card-value">{analytics.totalFavorites}</p>
            <span className="card-label">
              Customers who saved your business
            </span>
          </div>
        </div>
      </div>

      {/* Views Chart */}
      <div className="analytics-section">
        <h2>Profile Views Over Time</h2>
        {analytics.dailyViews.length > 0 ? (
          <div className="views-chart">
            {analytics.dailyViews.slice(-14).map((day, index) => (
              <div key={index} className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{
                    height: `${Math.max((day.count / maxViews) * 180, 4)}px`,
                  }}
                  title={`${day.date}: ${day.count} views`}
                >
                  {day.count > 0 && (
                    <span className="bar-value">{day.count}</span>
                  )}
                </div>
                <span className="chart-label">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-chart">
            <p>No view data yet. Views will appear here once customers visit your profile.</p>
          </div>
        )}
      </div>

      <div className="analytics-grid">
        {/* Click Breakdown */}
        <div className="analytics-section">
          <h2>Click Breakdown</h2>
          <p className="section-subtitle">How customers are engaging with your listing</p>
          <div className="click-breakdown">
            <div className="click-item">
              <div className="click-icon">📞</div>
              <div className="click-info">
                <strong>Phone Calls</strong>
                <span className="click-count">{analytics.clicksByType.phone}</span>
              </div>
              <div className="click-bar">
                <div
                  className="click-bar-fill phone"
                  style={{
                    width: `${analytics.clicksThisMonth > 0 ? (analytics.clicksByType.phone / analytics.clicksThisMonth) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="click-item">
              <div className="click-icon">✉️</div>
              <div className="click-info">
                <strong>Emails</strong>
                <span className="click-count">{analytics.clicksByType.email}</span>
              </div>
              <div className="click-bar">
                <div
                  className="click-bar-fill email"
                  style={{
                    width: `${analytics.clicksThisMonth > 0 ? (analytics.clicksByType.email / analytics.clicksThisMonth) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="click-item">
              <div className="click-icon">🌐</div>
              <div className="click-info">
                <strong>Website Visits</strong>
                <span className="click-count">{analytics.clicksByType.website}</span>
              </div>
              <div className="click-bar">
                <div
                  className="click-bar-fill website"
                  style={{
                    width: `${analytics.clicksThisMonth > 0 ? (analytics.clicksByType.website / analytics.clicksThisMonth) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="click-item">
              <div className="click-icon">🗺️</div>
              <div className="click-info">
                <strong>Map / Directions</strong>
                <span className="click-count">{analytics.clicksByType.map}</span>
              </div>
              <div className="click-bar">
                <div
                  className="click-bar-fill map"
                  style={{
                    width: `${analytics.clicksThisMonth > 0 ? (analytics.clicksByType.map / analytics.clicksThisMonth) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="analytics-section">
          <h2>Visitor Devices</h2>
          <p className="section-subtitle">How customers are finding you</p>
          <div className="device-breakdown">
            <div className="device-item">
              <div className="device-icon">📱</div>
              <div className="device-info">
                <strong>Mobile</strong>
                <span className="device-percent">
                  {analytics.viewsThisMonth > 0
                    ? Math.round((analytics.deviceBreakdown.mobile / analytics.viewsThisMonth) * 100)
                    : 0}%
                </span>
              </div>
              <span className="device-count">{analytics.deviceBreakdown.mobile} views</span>
            </div>

            <div className="device-item">
              <div className="device-icon">💻</div>
              <div className="device-info">
                <strong>Desktop</strong>
                <span className="device-percent">
                  {analytics.viewsThisMonth > 0
                    ? Math.round((analytics.deviceBreakdown.desktop / analytics.viewsThisMonth) * 100)
                    : 0}%
                </span>
              </div>
              <span className="device-count">{analytics.deviceBreakdown.desktop} views</span>
            </div>

            <div className="device-item">
              <div className="device-icon">📟</div>
              <div className="device-info">
                <strong>Tablet</strong>
                <span className="device-percent">
                  {analytics.viewsThisMonth > 0
                    ? Math.round((analytics.deviceBreakdown.tablet / analytics.viewsThisMonth) * 100)
                    : 0}%
                </span>
              </div>
              <span className="device-count">{analytics.deviceBreakdown.tablet} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      {analytics.topReferrers.length > 0 && (
        <div className="analytics-section">
          <h2>Where Visitors Come From</h2>
          <p className="section-subtitle">Top traffic sources to your profile</p>
          <div className="referrers-list">
            {analytics.topReferrers.map((ref, index) => (
              <div key={index} className="referrer-item">
                <div className="referrer-rank">{index + 1}</div>
                <div className="referrer-source">{ref.source}</div>
                <div className="referrer-count">{ref.count} visits</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="analytics-grid">
        {/* Recent Appointments */}
        <div className="analytics-section">
          <h2>Recent Appointments</h2>
          {appointments.length > 0 ? (
            <div className="activity-list">
              {appointments.map((apt) => (
                <div key={apt.id} className="activity-item">
                  <div className="activity-icon">📅</div>
                  <div className="activity-content">
                    <strong>{apt.customerName}</strong>
                    <span className="activity-detail">{apt.serviceName}</span>
                    <span className="activity-date">
                      {new Date(apt.scheduledDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })} at {apt.scheduledTime}
                    </span>
                  </div>
                  <span className={`status-badge ${apt.status}`}>
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-activity">
              <p>No appointments yet</p>
            </div>
          )}
        </div>

        {/* Recent Orders (if any) */}
        <div className="analytics-section">
          <h2>Recent Orders</h2>
          {orders.length > 0 ? (
            <div className="activity-list">
              {orders.map((order) => (
                <div key={order.id} className="activity-item">
                  <div className="activity-icon">🛒</div>
                  <div className="activity-content">
                    <strong>{order.userName}</strong>
                    <span className="activity-detail">{order.items.length} item(s)</span>
                    <span className="activity-date">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                  <span className={`status-badge ${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-activity">
              <p>No orders yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Pro Tips */}
      <div className="analytics-section tips-section">
        <h2>Tips to Improve Your Visibility</h2>
        <div className="tips-grid">
          {analytics.viewsThisMonth < 10 && (
            <div className="tip-card">
              <span className="tip-icon">💡</span>
              <div className="tip-content">
                <strong>Share Your Profile</strong>
                <p>Share your Try Local profile on social media to increase visibility.</p>
              </div>
            </div>
          )}
          {analytics.clicksByType.phone === 0 && (
            <div className="tip-card">
              <span className="tip-icon">📞</span>
              <div className="tip-content">
                <strong>Add Your Phone Number</strong>
                <p>Make sure your phone number is visible so customers can call directly.</p>
              </div>
            </div>
          )}
          {analytics.totalFavorites < 5 && (
            <div className="tip-card">
              <span className="tip-icon">⭐</span>
              <div className="tip-content">
                <strong>Ask for Reviews</strong>
                <p>Encourage happy customers to leave reviews and favorite your business.</p>
              </div>
            </div>
          )}
          <div className="tip-card">
            <span className="tip-icon">📸</span>
            <div className="tip-content">
              <strong>Add More Photos</strong>
              <p>Businesses with galleries get 2x more engagement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
