export function buildPdfHtml(data: any) {
  const { visit, tasks, observations, protocol } = data
  const doneTasks = tasks.filter((t: any) => t.done)
  const openTasks = tasks.filter((t: any) => !t.done)
  const date = visit.visit_date
    ? new Date(visit.visit_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const taskRows = doneTasks.map((t: any) => `
    <div class="task-row">
      <div class="task-check done"></div>
      <span class="task-text done-text">${t.text}</span>
      <span class="badge badge-done">Выполнено</span>
    </div>`).join('')

  const openRows = openTasks.map((t: any) => `
    <div class="task-row">
      <div class="task-check open"></div>
      <span class="task-text">${t.text}</span>
      <span class="badge badge-next">Визит № ${(visit.visit_number || 0) + 1}</span>
    </div>`).join('')

  const catLabel: any = { defect: 'Дефект', ok: 'Принято', note: 'Заметка', question: 'Вопрос' }
  const catColor: any = { defect: '#B85C3A', ok: '#5A8A6A', note: '#8A7A5A', question: '#5A6A8A' }

  const obsCards = observations.map((o: any) => `
    <div class="obs-card">
      ${o.photo_url
        ? `<img src="${o.photo_url}" class="obs-photo" />`
        : `<div class="obs-photo-placeholder"><span>фото</span></div>`}
      <div class="obs-body">
        <div class="obs-cat" style="color:${catColor[o.category] || '#888'}">${catLabel[o.category] || o.category}</div>
        <div class="obs-note">${o.note || ''}</div>
      </div>
    </div>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=PT+Sans:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'PT Sans', Arial, sans-serif; color: #1C1C1C; background: #fff; }

  .header { background: #1C1C1C; padding: 28px 36px 24px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .logo-mark { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .logo-icon { width: 26px; height: 26px; background: #B85C3A; display: flex; align-items: center; justify-content: center; }
  .logo-word { font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #fff; }
  .logo-tag { font-size: 10px; color: rgba(255,255,255,0.45); letter-spacing: 0.06em; padding-left: 36px; }
  .doc-label { text-align: right; }
  .doc-type { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #B85C3A; margin-bottom: 3px; }
  .doc-num { font-size: 11px; color: rgba(255,255,255,0.5); }
  .visit-name { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #fff; margin-bottom: 14px; line-height: 1.2; }
  .visit-name em { font-style: italic; color: rgba(255,255,255,0.6); }
  .meta-strip { display: flex; border-top: 0.5px solid rgba(255,255,255,0.1); padding-top: 14px; }
  .meta-item { flex: 1; padding-right: 16px; }
  .meta-item + .meta-item { border-left: 0.5px solid rgba(255,255,255,0.1); padding-left: 16px; }
  .meta-label { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 3px; }
  .meta-value { font-size: 12px; color: rgba(255,255,255,0.85); }

  .body { padding: 28px 36px; }
  .section { margin-bottom: 26px; page-break-inside: avoid; }
  .section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .section-num { width: 22px; height: 22px; background: #B85C3A; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #888076; }
  .section-line { flex: 1; height: 0.5px; background: #D4C8BD; }

  .task-row { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; border-bottom: 0.5px solid #F0EAE3; font-size: 13px; }
  .task-row:last-child { border-bottom: none; }
  .task-check { width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px; border: 1.5px solid #D4C8BD; }
  .task-check.done { background: #B85C3A; border-color: #B85C3A; }
  .task-text { flex: 1; color: #1C1C1C; line-height: 1.5; }
  .task-text.done-text { color: #888; text-decoration: line-through; }
  .badge { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 8px; flex-shrink: 0; }
  .badge-done { background: #F5EDE8; color: #B85C3A; }
  .badge-next { background: #F0EDE8; color: #888076; }

  .obs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .obs-card { border: 0.5px solid #E8E0D6; page-break-inside: avoid; }
  .obs-photo { width: 100%; height: 130px; object-fit: cover; display: block; }
  .obs-photo-placeholder { width: 100%; height: 130px; background: #F7F4F0; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #bbb; }
  .obs-body { padding: 8px 10px; }
  .obs-cat { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
  .obs-note { font-size: 11px; color: #3A3A3A; line-height: 1.55; }

  .proto-item { padding: 9px 0; border-bottom: 0.5px solid #F0EAE3; }
  .proto-item:last-child { border-bottom: none; }
  .proto-label { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #888076; margin-bottom: 4px; }
  .proto-text { font-size: 13px; color: #1C1C1C; line-height: 1.65; }

  .sign-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 28px; padding-top: 20px; border-top: 0.5px solid #D4C8BD; }
  .sign-line { height: 0.5px; background: #1C1C1C; margin-bottom: 6px; }
  .sign-name { font-size: 11px; color: #1C1C1C; margin-bottom: 2px; }
  .sign-role { font-size: 10px; color: #888076; }

  .footer { background: #1C1C1C; padding: 12px 36px; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { display: flex; align-items: center; gap: 8px; }
  .footer-dot { width: 6px; height: 6px; background: #B85C3A; }
  .footer-name { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
  .footer-mid { font-size: 10px; color: rgba(255,255,255,0.3); }
  .footer-page { font-size: 10px; color: rgba(255,255,255,0.4); }

  @page { size: A4; margin: 0; }
</style>
</head>
<body>

<div class="header">
  <div class="header-top">
    <div>
      <div class="logo-mark">
        <div class="logo-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="4" width="12" height="4" fill="white" opacity="0.9"/>
            <rect x="1" y="9" width="5.5" height="4" fill="white" opacity="0.6"/>
            <rect x="7.5" y="9" width="5.5" height="4" fill="white" opacity="0.6"/>
          </svg>
        </div>
        <div class="logo-word">Brick Buro</div>
      </div>
      <div class="logo-tag">дизайн коммерческих интерьеров · Санкт-Петербург</div>
    </div>
    <div class="doc-label">
      <div class="doc-type">Журнал авт. сопровождения</div>
      <div class="doc-num">№ АС-${new Date().getFullYear()}-${String(visit.visit_number || 1).padStart(3, '0')}</div>
    </div>
  </div>
  <div class="visit-name">${visit.object_name} — <em>Визит № ${visit.visit_number || 1}</em></div>
  <div class="meta-strip">
    <div class="meta-item"><div class="meta-label">Дата визита</div><div class="meta-value">${date}</div></div>
    <div class="meta-item"><div class="meta-label">Автор надзора</div><div class="meta-value">${visit.author || '—'}</div></div>
    <div class="meta-item"><div class="meta-label">Этап</div><div class="meta-value">${visit.stage || '—'}</div></div>
  </div>
</div>

<div class="body">
  ${doneTasks.length > 0 || openTasks.length > 0 ? `
  <div class="section">
    <div class="section-head">
      <div class="section-num">01</div>
      <div class="section-title">Выполнение плановых задач</div>
      <div class="section-line"></div>
    </div>
    ${taskRows}
    ${openRows}
  </div>` : ''}

  ${observations.length > 0 ? `
  <div class="section">
    <div class="section-head">
      <div class="section-num">02</div>
      <div class="section-title">Замечания и фиксация на объекте</div>
      <div class="section-line"></div>
    </div>
    <div class="obs-grid">${obsCards}</div>
  </div>` : ''}

  ${protocol && (protocol.discussed || protocol.agreed) ? `
  <div class="section">
    <div class="section-head">
      <div class="section-num">03</div>
      <div class="section-title">Протокол совещания на объекте</div>
      <div class="section-line"></div>
    </div>
    ${protocol.attendees ? `<div class="proto-item"><div class="proto-label">Участники</div><div class="proto-text">${protocol.attendees}</div></div>` : ''}
    ${protocol.discussed ? `<div class="proto-item"><div class="proto-label">Обсудили</div><div class="proto-text">${protocol.discussed}</div></div>` : ''}
    ${protocol.agreed ? `<div class="proto-item"><div class="proto-label">Договорились</div><div class="proto-text">${protocol.agreed}</div></div>` : ''}
    ${protocol.next_visit ? `<div class="proto-item"><div class="proto-label">На следующий визит</div><div class="proto-text">${protocol.next_visit}</div></div>` : ''}
  </div>` : ''}

  <div class="sign-row">
    <div><div class="sign-line"></div><div class="sign-name">${visit.author || '________________'}</div><div class="sign-role">Архитектор / авт. надзор</div></div>
    <div><div class="sign-line"></div><div class="sign-name">________________</div><div class="sign-role">Прораб</div></div>
    <div><div class="sign-line"></div><div class="sign-name">________________</div><div class="sign-role">Заказчик</div></div>
  </div>
</div>

<div class="footer">
  <div class="footer-brand"><div class="footer-dot"></div><div class="footer-name">Brick Buro</div></div>
  <div class="footer-mid">Журнал авт. сопровождения · ${visit.object_name} · Визит № ${visit.visit_number || 1} · ${date}</div>
  <div class="footer-page">стр. 1</div>
</div>

</body>
</html>`
}
