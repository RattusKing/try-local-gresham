'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/auth-context'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase/config'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { Favorite } from '@/lib/types'
import DashboardNav from '@/components/DashboardNav'
import Link from 'next/link'
import './favorites.css'

export default function FavoritesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'business' | 'product'>('all')

  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user])

  const loadFavorites = async () => {
    if (!db || !user) return

    try {
      setLoading(true)
      const favoritesRef = collection(db, 'favorites')
      const q = query(favoritesRef, where('userId', '==', user.uid))
      const snapshot = await getDocs(q)

      const loadedFavorites = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Favorite
      })

      // Sort by most recent first
      loadedFavorites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setFavorites(loadedFavorites)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    if (!db || !confirm('Remove from favorites?')) return

    try {
      await deleteDoc(doc(db, 'favorites', favoriteId))
      setFavorites(favorites.filter((f) => f.id !== favoriteId))
    } catch (error) {
      console.error('Error removing favorite:', error)
      alert('Failed to remove favorite')
    }
  }

  if (!user) {
    return (
      <div className="dashboard-layout">
        <DashboardNav />
        <main className="dashboard-content">
          <p>Please sign in to view your favorites.</p>
        </main>
      </div>
    )
  }

  const filteredFavorites = favorites.filter((fav) => {
    if (filter === 'all') return true
    return fav.itemType === filter
  })

  const businessFavorites = filteredFavorites.filter((f) => f.itemType === 'business')
  const productFavorites = filteredFavorites.filter((f) => f.itemType === 'product')

  return (
    <div className="dashboard-layout">
      <DashboardNav />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>My Favorites</h1>
          <p className="favorites-count">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {loading ? (
          <div className="favorites-loading">
            <div className="spinner"></div>
            <p>Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="favorites-empty">
            <div className="empty-icon">❤️</div>
            <h2>No favorites yet</h2>
            <p>
              Start exploring and save your favorite businesses and products to see them here!
            </p>
            <Link href="/" className="btn btn-primary">
              Explore Businesses
            </Link>
          </div>
        ) : (
          <>
            <div className="favorites-filter">
              <button
                className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('all')}
              >
                All ({favorites.length})
              </button>
              <button
                className={filter === 'business' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('business')}
              >
                Businesses ({businessFavorites.length})
              </button>
              <button
                className={filter === 'product' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('product')}
              >
                Products ({productFavorites.length})
              </button>
            </div>

            {filteredFavorites.length === 0 ? (
              <div className="favorites-empty">
                <p>No {filter === 'business' ? 'businesses' : 'products'} favorited yet.</p>
              </div>
            ) : (
              <div className="favorites-grid">
                {filteredFavorites.map((favorite) => (
                  <div key={favorite.id} className="favorite-card">
                    {favorite.itemImage && (
                      <div className="favorite-image">
                        <img src={favorite.itemImage} alt={favorite.itemName} />
                      </div>
                    )}
                    <div className="favorite-content">
                      <div className="favorite-header">
                        <div>
                          <h3>{favorite.itemName}</h3>
                          {favorite.itemType === 'product' && favorite.businessName && (
                            <p className="favorite-business">{favorite.businessName}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFavorite(favorite.id)}
                          className="favorite-remove"
                          title="Remove from favorites"
                        >
                          ❤️
                        </button>
                      </div>
                      <div className="favorite-meta">
                        <span className="favorite-type">
                          {favorite.itemType === 'business' ? '🏪 Business' : '📦 Product'}
                        </span>
                        <span className="favorite-date">
                          Added {favorite.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <Link
                        href={
                          favorite.itemType === 'business'
                            ? `/business/${favorite.itemId}`
                            : `/business/${favorite.itemId.split('_')[0]}` // Assuming product ID format
                        }
                        className="btn btn-primary btn-small"
                      >
                        View {favorite.itemType === 'business' ? 'Business' : 'Details'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
