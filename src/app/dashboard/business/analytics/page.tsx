'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Order, Product } from '@/lib/types'
import './analytics.css'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  ordersToday: number
  revenueToday: number
  ordersByStatus: Record<string, number>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>
  recentOrders: Order[]
}

export default function BusinessAnalytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')

  useEffect(() => {
    loadAnalytics()
  }, [user, timeRange])

  const loadAnalytics = async () => {
    if (!user || !db) return

    try {
      setLoading(true)

      // Fetch all orders for this business (without orderBy to avoid composite index)
      const ordersQuery = query(
        collection(db, 'orders'),
        where('businessId', '==', user.uid)
      )
      const ordersSnap = await getDocs(ordersQuery)
      const orders = ordersSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Order[]

      // Sort by createdAt descending on client-side
      orders.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0
        return b.createdAt.getTime() - a.createdAt.getTime() // Descending order (newest first)
      })

      // Calculate date range
      const daysAgo = parseInt(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      const filteredOrders = orders.filter(
        (order) => order.createdAt && order.createdAt >= startDate
      )

      // Calculate metrics
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
      const totalOrders = filteredOrders.length

      // Today's metrics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todaysOrders = filteredOrders.filter(
        (order) => order.createdAt && order.createdAt >= today
      )
      const ordersToday = todaysOrders.length
      const revenueToday = todaysOrders.reduce((sum, order) => sum + order.total, 0)

      // Orders by status
      const ordersByStatus: Record<string, number> = {}
      filteredOrders.forEach((order) => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1
      })

      // Top products
      const productMap = new Map<
        string,
        { name: string; quantity: number; revenue: number }
      >()
      filteredOrders.forEach((order) => {
        order.items.forEach((item) => {
          const existing = productMap.get(item.productId)
          if (existing) {
            existing.quantity += item.quantity
            existing.revenue += item.price * item.quantity
          } else {
            productMap.set(item.productId, {
              name: item.productName,
              quantity: item.quantity,
              revenue: item.price * item.quantity,
            })
          }
        })
      })
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Revenue by day
      const revenueMap = new Map<string, { revenue: number; orders: number }>()
      filteredOrders.forEach((order) => {
        if (!order.createdAt) return
        const dateStr = order.createdAt.toISOString().split('T')[0]
        const existing = revenueMap.get(dateStr)
        if (existing) {
          existing.revenue += order.total
          existing.orders += 1
        } else {
          revenueMap.set(dateStr, { revenue: order.total, orders: 1 })
        }
      })
      const revenueByDay = Array.from(revenueMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        ordersToday,
        revenueToday,
        ordersByStatus,
        topProducts,
        revenueByDay,
        recentOrders: orders.slice(0, 10),
      })
    } catch (err: any) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!analytics) return

    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${analytics.totalRevenue.toFixed(2)}`],
      ['Total Orders', analytics.totalOrders.toString()],
      ['Average Order Value', `$${analytics.averageOrderValue.toFixed(2)}`],
      ['Orders Today', analytics.ordersToday.toString()],
      ['Revenue Today', `$${analytics.revenueToday.toFixed(2)}`],
      [],
      ['Top Products'],
      ['Product', 'Quantity Sold', 'Revenue'],
      ...analytics.topProducts.map((p) => [
        p.name,
        p.quantity.toString(),
        `$${p.revenue.toFixed(2)}`,
      ]),
      [],
      ['Daily Revenue'],
      ['Date', 'Revenue', 'Orders'],
      ...analytics.revenueByDay.map((d) => [
        d.date,
        `$${d.revenue.toFixed(2)}`,
        d.orders.toString(),
      ]),
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
        <p>No analytics data available</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...analytics.revenueByDay.map((d) => d.revenue), 1)

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
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="analytics-cards">
        <div className="analytics-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <p className="card-value">${analytics.totalRevenue.toFixed(2)}</p>
            <span className="card-label">Last {timeRange} days</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>Total Orders</h3>
            <p className="card-value">{analytics.totalOrders}</p>
            <span className="card-label">Last {timeRange} days</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Avg Order Value</h3>
            <p className="card-value">${analytics.averageOrderValue.toFixed(2)}</p>
            <span className="card-label">Per order</span>
          </div>
        </div>

        <div className="analytics-card highlight">
          <div className="card-icon">🔥</div>
          <div className="card-content">
            <h3>Today</h3>
            <p className="card-value">{analytics.ordersToday} orders</p>
            <span className="card-label">${analytics.revenueToday.toFixed(2)} revenue</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="analytics-section">
        <h2>Revenue Over Time</h2>
        <div className="revenue-chart">
          {analytics.revenueByDay.map((day, index) => (
            <div key={index} className="chart-bar-container">
              <div
                className="chart-bar"
                style={{
                  height: `${(day.revenue / maxRevenue) * 200}px`,
                }}
                title={`${day.date}: $${day.revenue.toFixed(2)} (${day.orders} orders)`}
              >
                <span className="bar-value">${day.revenue.toFixed(0)}</span>
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
      </div>

      <div className="analytics-grid">
        {/* Top Products */}
        <div className="analytics-section">
          <h2>Top Selling Products</h2>
          <div className="top-products-list">
            {analytics.topProducts.length === 0 ? (
              <p className="empty-message">No products sold yet</p>
            ) : (
              analytics.topProducts.map((product, index) => (
                <div key={index} className="product-row">
                  <div className="product-rank">{index + 1}</div>
                  <div className="product-info">
                    <strong>{product.name}</strong>
                    <span className="product-meta">
                      {product.quantity} sold · ${product.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="product-progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${(product.revenue / analytics.topProducts[0].revenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="analytics-section">
          <h2>Order Status</h2>
          <div className="status-breakdown">
            {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
              <div key={status} className="status-item">
                <div className="status-header">
                  <span className={`status-badge ${status}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <span className="status-count">{count}</span>
                </div>
                <div className="status-progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${(count / analytics.totalOrders) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="analytics-section">
        <h2>Recent Orders</h2>
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id.slice(-6).toUpperCase()}</td>
                  <td>{order.userName}</td>
                  <td>
                    {order.createdAt?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>{order.items.length}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
