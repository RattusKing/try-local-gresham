interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'completed' | 'cancelled'
  size?: 'small' | 'medium' | 'large'
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'approved':
      case 'active':
      case 'completed':
        return {
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          border: '2px solid rgba(16, 185, 129, 0.3)',
        }
      case 'pending':
        return {
          background: 'rgba(245, 158, 11, 0.1)',
          color: '#d97706',
          border: '2px solid rgba(245, 158, 11, 0.3)',
        }
      case 'rejected':
      case 'inactive':
      case 'cancelled':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '2px solid rgba(239, 68, 68, 0.3)',
        }
      default:
        return {
          background: 'rgba(107, 114, 128, 0.1)',
          color: '#6b7280',
          border: '2px solid rgba(107, 114, 128, 0.3)',
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '0.25rem 0.625rem',
          fontSize: '0.75rem',
          fontWeight: 600,
        }
      case 'large':
        return {
          padding: '0.625rem 1.25rem',
          fontSize: '1rem',
          fontWeight: 700,
        }
      case 'medium':
      default:
        return {
          padding: '0.375rem 0.875rem',
          fontSize: '0.875rem',
          fontWeight: 600,
        }
    }
  }

  const statusStyles = getStatusStyles()
  const sizeStyles = getSizeStyles()

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
      case 'active':
      case 'completed':
        return '✓'
      case 'pending':
        return '⏳'
      case 'rejected':
      case 'cancelled':
        return '✕'
      case 'inactive':
        return '○'
      default:
        return ''
    }
  }

  const getStatusLabel = () => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        borderRadius: '999px',
        textTransform: 'capitalize',
        transition: 'all 0.2s ease',
        ...statusStyles,
        ...sizeStyles,
      }}
    >
      <span>{getStatusIcon()}</span>
      <span>{getStatusLabel()}</span>
    </span>
  )
}
