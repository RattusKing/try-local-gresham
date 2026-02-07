'use client'

import ProfileEditor from '@/components/ProfileEditor'
import NotificationSettings from '@/components/NotificationSettings'

export default function AdminProfilePage() {
  return (
    <div style={{ padding: '2rem' }}>
      <ProfileEditor />
      <div style={{ marginTop: '2rem' }}>
        <NotificationSettings />
      </div>
    </div>
  )
}
