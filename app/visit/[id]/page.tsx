'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import s from './page.module.css'

const CATS = [
  { id: 'defect', label: 'Дефект', color: '#B85C3A' },
  { id: 'ok', label: 'Принято', color: '#5A8A6A' },
  { id: 'note', label: 'Заметка', color: '#8A7A5A' },
  { id: 'question', label: 'Вопрос', color: '#5A6A8A' },
]

export default function VisitPage() {
  const { id } = useParams()
  const router = useRouter()
  const isNew = id === 'new'

  const [tab, setTab] = useState<'meta'|'tasks'|'obs'|'protocol'|'report'>('meta')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentOk, setSentOk] = useState(false)
  const [visitId, setVisitId] = useState<string|null>(isNew ? null : id as string)

  const [objectName, setObjectName] = useState('')
  const [visitNumber, setVisitNumber] = useState(1)
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [author, setAuthor] = useState('')
  const [stage, setStage] = useState('')

  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState('')

  const [obs, setObs] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingObsRef = useRef<any>(null)

  const [attendees, setAttendees] = useState('')
  const [discussed, setDiscussed] = useState('')
  const [agreed, setAgreed] = useState('')
  const [nextVisit, setNextVisit] = useState('')

  const [emails, setEmails] = useState('')

  useEffect(() => {
    if (!isNew && visitId) loadVisit()
  }, [visitId])

  async function loadVisit() {
    const [{ data: v }, { data: t }, { data: o }, { data: p }] = await Promise.all([
      supabase.from('visits').select('*').eq('id', visitId).single(),
      supabase.from('tasks').select('*').eq('visit_id', visitId).order('created_at'),
      supabase.from('observations').select('*').eq('visit_id', visitId).order('sort_order'),
      supabase.from('protocol').select('*').eq('visit_id', visitId).single(),
    ])
    if (v) { setObjectName(v.object_name||''); setVisitNumber(v.visit_number||1); setVisitDate(v.visit_date||''); setAuthor(v.author||''); setStage(v.stage||'') }
    if (t) setTasks(t)
    if (o) setObs(o)
    if (p) { setAttendees(p.attendees||''); setDiscussed(p.discussed||''); setAgreed(p.agreed||''); setNextVisit(p.next_visit||'') }
  }

  async function saveVisit() {
    setSaving(true)
    try {
      const visitData = { object_name: objectName, visit_number: visitNumber, visit_date: visitDate, author, stage }
      let vid = visitId
      if (isNew || !vid) {
        const { data } = await supabase.from('visits').insert(visitData).select().single()
        vid = data.id
        setVisitId(vid)
        router.replace(`/visit/${vid}`)
      } else {
        await supabase.from('visits').update(visitData).eq('id', vid)
      }
      await supabase.from('protocol').upsert({ visit_id: vid, attendees, discussed, agreed, next_visit: nextVisit }, { onConflict: 'visit_id' })
      alert('Сохранено!')
    } catch(e) { alert('Ошибка сохранения') }
    setSaving(false)
  }

  async function addTask() {
    if (!newTask.trim() || !visitId) return
    const { data } = await supabase.from('tasks').insert({ visit_id: visitId, text: newTask, done: false }).select().single()
    setTasks([...tasks, data])
    setNewTask('')
  }

  async function toggleTask(t: any) {
    await supabase.from('tasks').update({ done: !t.done }).eq('id', t.id)
    setTasks(tasks.map(x => x.id === t.id ? { ...x, done: !x.done } : x))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  async function addObs() {
    if (!visitId) { alert('Сначала сохраните визит'); return }
    pendingObsRef.current = { visit_id: visitId, category: 'defect', note: '', sort_order: obs.length }
    fileRef.current?.click()
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = `visits/${visitId}/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('site-photos').upload(path, file, { contentType: 'image/jpeg' })
    if (error) { alert('Ошибка загрузки фото: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('site-photos').getPublicUrl(path)
    const obsData = { ...pendingObsRef.current, photo_url: publicUrl }
    const { data } = await supabase.from('observations').insert(obsData).select().single()
    setObs([...obs, data])
    e.target.value = ''
  }

  async function updateObs(id: string, field: string, val: string) {
    await supabase.from('observations').update({ [field]: val }).eq('id', id)
    setObs(obs.map(o => o.id === id ? { ...o, [field]: val } : o))
  }

  async function deleteObs(id: string) {
    await supabase.from('observations').delete().eq('id', id)
    setObs(obs.filter(o => o.id !== id))
  }

  async function generatePdf() {
    const data = buildData()
    const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AS_vizit_${visitNumber}.pdf`
    a.click()
  }

  async function sendReport() {
    if (!emails.trim()) { alert('Введите email получателей'); return }
    setSending(true)
    const recipients = emails.split(',').map(e => e.trim()).filter(Boolean)
    const data = buildData()
    const res = await fetch('/api/send-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, recipients }) })
    setSending(false)
    if (res.ok) { setSentOk(true); setTimeout(() => setSentOk(false), 4000) }
    else { const e = await res.json(); alert('Ошибка: ' + e.error) }
  }

  function buildData() {
    return {
      visit: { object_name: objectName, visit_number: visitNumber, visit_date: visitDate, author, stage },
      tasks,
      observations: obs,
      protocol: { attendees, discussed, agreed, next_visit: nextVisit },
    }
  }

  const doneCnt = tasks.filter(t => t.done).length
  const openCnt = tasks.filter(t => !t.done).length

  return (
    <div className={s.page}>
      <div className={s.header}>
        <Link href="/" className={s.back}>← Все визиты</Link>
        <div className={s.headerTitle}>{objectName || 'Новый визит'}</div>
        <button className={s.saveBtn} onClick={saveVisit} disabled={saving}>{saving ? '...' : 'Сохранить'}</button>
      </div>

      <div className={s.tabs}>
        {([['meta','Объект'],['tasks','Задачи'],['obs','Фото'],['protocol','Протокол'],['report','Отчёт']] as const).map(([key, label]) => (
          <button key={key} className={`${s.tab} ${tab === key ? s.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className={s.body}>

        {tab === 'meta' && (
          <div className={s.section}>
            <div className={s.field}><label className={s.label}>Название объекта</label><input className={s.input} value={objectName} onChange={e => setObjectName(e.target.value)} placeholder="ЖК «Северная звезда»" /></div>
            <div className={s.row}>
              <div className={s.field}><label className={s.label}>Номер визита</label><input className={s.input} type="number" value={visitNumber} onChange={e => setVisitNumber(+e.target.value)} /></div>
              <div className={s.field}><label className={s.label}>Дата</label><input className={s.input} type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} /></div>
            </div>
            <div className={s.field}><label className={s.label}>Автор надзора</label><input className={s.input} value={author} onChange={e => setAuthor(e.target.value)} placeholder="Иванова А.С., арх." /></div>
            <div className={s.field}><label className={s.label}>Этап строительства</label><input className={s.input} value={stage} onChange={e => setStage(e.target.value)} placeholder="Отделочные работы" /></div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className={s.section}>
            <div className={s.counters}>
              <span className={s.counter}>Выполнено: <b>{doneCnt}</b></span>
              <span className={s.counter}>Открыто: <b>{openCnt}</b></span>
            </div>
            <div className={s.addRow}>
              <input className={s.input} value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Добавить задачу..." onKeyDown={e => e.key === 'Enter' && addTask()} />
              <button className={s.btnAdd} onClick={addTask}>+</button>
            </div>
            {tasks.map(t => (
              <div key={t.id} className={`${s.taskRow} ${t.done ? s.taskDone : ''}`}>
                <div className={`${s.checkbox} ${t.done ? s.checked : ''}`} onClick={() => toggleTask(t)} />
                <span className={s.taskText}>{t.text}</span>
                <button className={s.delBtn} onClick={() => deleteTask(t.id)}>×</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'obs' && (
          <div className={s.section}>
            <button className={s.addPhotoBtn} onClick={addObs}>+ Добавить наблюдение</button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhoto} />
            <div className={s.obsGrid}>
              {obs.map(o => (
                <div key={o.id} className={s.obsCard}>
                  {o.photo_url
                    ? <img src={o.photo_url} className={s.obsPhoto} alt="" />
                    : <div className={s.obsPhotoEmpty}>фото</div>}
                  <div className={s.obsCats}>
                    {CATS.map(c => (
                      <span key={c.id} className={`${s.catBadge} ${o.category === c.id ? s.catActive : ''}`}
                        style={o.category === c.id ? { background: c.color, color: 'white' } : {}}
                        onClick={() => updateObs(o.id, 'category', c.id)}>{c.label}</span>
                    ))}
                  </div>
                  <textarea className={s.obsNote} rows={2} placeholder="Описание..." defaultValue={o.note} onBlur={e => updateObs(o.id, 'note', e.target.value)} />
                  <button className={s.obsDelBtn} onClick={() => deleteObs(o.id)}>удалить</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'protocol' && (
          <div className={s.section}>
            <div className={s.field}><label className={s.label}>Участники совещания</label><input className={s.input} value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="Иванова А.С. (архитектор), Петров В.И. (прораб)..." /></div>
            <div className={s.field}><label className={s.label}>Обсудили</label><textarea className={s.textarea} value={discussed} onChange={e => setDiscussed(e.target.value)} placeholder="Перечислите обсуждённые вопросы..." /></div>
            <div className={s.field}><label className={s.label}>Договорились</label><textarea className={s.textarea} value={agreed} onChange={e => setAgreed(e.target.value)} placeholder="Зафиксируйте решения..." /></div>
            <div className={s.field}><label className={s.label}>Вопросы на следующий визит</label><textarea className={s.textarea} value={nextVisit} onChange={e => setNextVisit(e.target.value)} placeholder="Что проверить / уточнить..." /></div>
          </div>
        )}

        {tab === 'report' && (
          <div className={s.section}>
            <div className={s.reportSummary}>
              <div className={s.sumCard}><div className={s.sumLabel}>Выполнено</div><div className={s.sumVal}>{doneCnt}</div></div>
              <div className={s.sumCard}><div className={s.sumLabel}>Открыто</div><div className={s.sumVal}>{openCnt}</div></div>
              <div className={s.sumCard}><div className={s.sumLabel}>Замечаний</div><div className={s.sumVal}>{obs.length}</div></div>
            </div>
            <button className={s.btnBrick} onClick={generatePdf} style={{ marginBottom: 16 }}>Скачать PDF</button>
            <div className={s.field}><label className={s.label}>Отправить участникам (через запятую)</label>
              <input className={s.input} value={emails} onChange={e => setEmails(e.target.value)} placeholder="client@mail.ru, foreman@mail.ru" /></div>
            <button className={s.btnBrick} onClick={sendReport} disabled={sending}>{sending ? 'Отправляю...' : 'Отправить PDF по email'}</button>
            {sentOk && <div className={s.sentOk}>Отчёт отправлен!</div>}
          </div>
        )}

      </div>
    </div>
  )
}
