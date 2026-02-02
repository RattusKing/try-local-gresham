'use client'

import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { useEffect, useState, useCallback } from 'react'
import { QuoteRequest, QuoteRequestStatus } from '@/lib/types'
import './quotes.css'

export default function BusinessQuoteRequests() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<'pending' | 'active' | 'closed' | 'all'>('pending')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const [editingQuote, setEditingQuote] = useState<string | null>(null)
  const [quoteAmount, setQuoteAmount] = useState('')

  const loadQuotes = useCallback(async () => {
    if (!user || !db) return

    try {
      setLoading(true)
      const quotesQuery = query(
        collection(db, 'quoteRequests'),
        where('businessId', '==', user.uid)
      )
      const quotesSnap = await getDocs(quotesQuery)
      const quotesList = quotesSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        quotedAt: doc.data().quotedAt?.toDate(),
      })) as QuoteRequest[]

      // Sort by createdAt descending (newest first)
      quotesList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      setQuotes(quotesList)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, db])

  useEffect(() => {
    loadQuotes()
  }, [user, loadQuotes])

  const updateStatus = async (quoteId: string, status: QuoteRequestStatus) => {
    if (!db) return

    try {
      const quoteRef = doc(db, 'quoteRequests', quoteId)
      await updateDoc(quoteRef, {
        status,
        updatedAt: new Date(),
      })
      setSuccess('Quote status updated!')
      setTimeout(() => setSuccess(''), 3000)
      await loadQuotes()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveNotes = async (quoteId: string) => {
    if (!db) return

    try {
      const quoteRef = doc(db, 'quoteRequests', quoteId)
      await updateDoc(quoteRef, {
        businessNotes: notesText,
        updatedAt: new Date(),
      })
      setSuccess('Notes saved!')
      setTimeout(() => setSuccess(''), 3000)
      setEditingNotes(null)
      setNotesText('')
      await loadQuotes()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveQuoteAmount = async (quoteId: string) => {
    if (!db) return

    const amount = parseFloat(quoteAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid quote amount')
      return
    }

    try {
      const quoteRef = doc(db, 'quoteRequests', quoteId)
      await updateDoc(quoteRef, {
        quotedAmount: amount,
        quotedAt: new Date(),
        status: 'quoted',
        updatedAt: new Date(),
      })
      setSuccess('Quote amount saved!')
      setTimeout(() => setSuccess(''), 3000)
      setEditingQuote(null)
      setQuoteAmount('')
      await loadQuotes()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const startEditingNotes = (quote: QuoteRequest) => {
    setEditingNotes(quote.id)
    setNotesText(quote.businessNotes || '')
  }

  const startEditingQuote = (quote: QuoteRequest) => {
    setEditingQuote(quote.id)
    setQuoteAmount(quote.quotedAmount?.toString() || '')
  }

  const filteredQuotes = quotes.filter((quote) => {
    if (filter === 'pending') {
      return quote.status === 'pending'
    } else if (filter === 'active') {
      return quote.status === 'contacted' || quote.status === 'quoted'
    } else if (filter === 'closed') {
      return quote.status === 'won' || quote.status === 'lost' || quote.status === 'archived'
    }
    return true
  })

  const pendingCount = quotes.filter((q) => q.status === 'pending').length
  const activeCount = quotes.filter((q) => q.status === 'contacted' || q.status === 'quoted').length

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <span className="urgency-badge urgent">Urgent</span>
      case 'standard':
        return <span className="urgency-badge standard">Standard</span>
      case 'flexible':
        return <span className="urgency-badge flexible">Flexible</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading quote requests...</p>
      </div>
    )
  }

  return (
    <div className="business-dashboard">
      <div className="business-dashboard-header">
        <h1>Quote Requests</h1>
        <div className="quotes-count">
          {pendingCount > 0 && (
            <span className="count-badge pending">{pendingCount} new</span>
          )}
          {activeCount > 0 && (
            <span className="count-badge active">{activeCount} active</span>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="quotes-filters">
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          New ({pendingCount})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({activeCount})
        </button>
        <button
          className={`filter-btn ${filter === 'closed' ? 'active' : ''}`}
          onClick={() => setFilter('closed')}
        >
          Closed
        </button>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</span>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No quote requests</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {filter === 'pending'
              ? 'No new quote requests'
              : filter === 'active'
              ? 'No active quotes being worked on'
              : filter === 'closed'
              ? 'No closed quotes yet'
              : 'No quote requests yet'}
          </p>
        </div>
      ) : (
        <div className="quotes-list">
          {filteredQuotes.map((quote) => (
            <div key={quote.id} className={`quote-card status-${quote.status}`}>
              <div className="quote-header">
                <div className="quote-service">
                  <h3>{quote.serviceType}</h3>
                  <div className="quote-badges">
                    <span className={`status-badge status-${quote.status}`}>
                      {quote.status}
                    </span>
                    {getUrgencyBadge(quote.urgency)}
                  </div>
                </div>
                {quote.quotedAmount && (
                  <div className="quote-amount">
                    ${quote.quotedAmount.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="quote-description">
                <p>{quote.description}</p>
              </div>

              <div className="quote-details">
                <div className="detail-row">
                  <span className="detail-icon">👤</span>
                  <span className="detail-label">Customer:</span>
                  <span className="detail-value">{quote.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">📧</span>
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">
                    <a href={`mailto:${quote.customerEmail}`}>{quote.customerEmail}</a>
                  </span>
                </div>
                {quote.customerPhone && (
                  <div className="detail-row">
                    <span className="detail-icon">📱</span>
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">
                      <a href={`tel:${quote.customerPhone}`}>{quote.customerPhone}</a>
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-icon">💬</span>
                  <span className="detail-label">Preferred Contact:</span>
                  <span className="detail-value">{quote.preferredContact}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">📅</span>
                  <span className="detail-label">Received:</span>
                  <span className="detail-value">
                    {quote.createdAt
                      ? new Date(quote.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Quote Amount Editor */}
              {editingQuote === quote.id ? (
                <div className="quote-editor">
                  <label>Enter Quote Amount ($):</label>
                  <div className="quote-input-row">
                    <input
                      type="number"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <button className="btn-primary" onClick={() => saveQuoteAmount(quote.id)}>
                      Save Quote
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditingQuote(null)
                        setQuoteAmount('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                quote.status !== 'won' &&
                quote.status !== 'lost' &&
                quote.status !== 'archived' && (
                  <button className="btn-add-quote" onClick={() => startEditingQuote(quote)}>
                    {quote.quotedAmount ? '✏️ Update Quote Amount' : '💰 Enter Quote Amount'}
                  </button>
                )
              )}

              {/* Business Notes */}
              <div className="business-notes">
                {editingNotes === quote.id ? (
                  <div className="notes-editor">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add internal notes about this quote request..."
                      rows={3}
                    />
                    <div className="notes-actions">
                      <button className="btn-primary" onClick={() => saveNotes(quote.id)}>
                        Save Notes
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setEditingNotes(null)
                          setNotesText('')
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {quote.businessNotes ? (
                      <div className="notes-display">
                        <strong>Internal Notes:</strong>
                        <p>{quote.businessNotes}</p>
                        <button
                          className="btn-edit-notes"
                          onClick={() => startEditingNotes(quote)}
                        >
                          Edit Notes
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-add-notes"
                        onClick={() => startEditingNotes(quote)}
                      >
                        + Add Internal Notes
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="quote-actions">
                {quote.status === 'pending' && (
                  <button
                    className="btn-contacted"
                    onClick={() => updateStatus(quote.id, 'contacted')}
                  >
                    Mark Contacted
                  </button>
                )}
                {quote.status === 'contacted' && (
                  <button
                    className="btn-quoted"
                    onClick={() => startEditingQuote(quote)}
                  >
                    Send Quote
                  </button>
                )}
                {(quote.status === 'quoted' || quote.status === 'contacted') && (
                  <>
                    <button
                      className="btn-won"
                      onClick={() => updateStatus(quote.id, 'won')}
                    >
                      Won
                    </button>
                    <button
                      className="btn-lost"
                      onClick={() => updateStatus(quote.id, 'lost')}
                    >
                      Lost
                    </button>
                  </>
                )}
                {quote.status !== 'archived' &&
                  quote.status !== 'won' &&
                  quote.status !== 'lost' && (
                    <button
                      className="btn-archive"
                      onClick={() => updateStatus(quote.id, 'archived')}
                    >
                      Archive
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
