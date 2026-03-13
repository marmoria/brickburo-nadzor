'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setVisits(data || []); setLoading(false) })
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="4" width="12" height="4" fill="white" opacity="0.9"/>
              <rect x="1" y="9" width="5.5" height="4" fill="white" opacity="0.6"/>
              <rect x="7.5" y="9" width="5.5" height="4" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <span className={styles.logoWord}>Brick Buro</span>
        </div>
        <div className={styles.headerTitle}>Авторский надзор</div>
      </div>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <h1 className={styles.h1}>Визиты</h1>
          <Link href="/visit/new" className={styles.btnPrimary}>+ Новый визит</Link>
        </div>

        {loading && <div className={styles.empty}>Загрузка...</div>}

        {!loading && visits.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Визитов пока нет</div>
            <div className={styles.emptyText}>Нажмите «Новый визит» чтобы начать</div>
          </div>
        )}

        <div className={styles.visitList}>
          {visits.map(v => (
            <Link key={v.id} href={`/visit/${v.id}`} className={styles.visitCard}>
              <div className={styles.visitName}>{v.object_name || 'Без названия'}</div>
              <div className={styles.visitMeta}>
                Визит № {v.visit_number || '—'} ·{' '}
                {v.visit_date ? new Date(v.visit_date).toLocaleDateString('ru-RU') : '—'} ·{' '}
                {v.author || '—'}
              </div>
              <div className={styles.visitArrow}>→</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
