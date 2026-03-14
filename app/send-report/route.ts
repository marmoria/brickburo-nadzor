import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { buildPdfHtml } from '@/lib/pdf-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { data, recipients } = await req.json()
    const html = buildPdfHtml(data)

    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })
    await browser.close()

    const visitNum = data.visit.visit_number || 1
    const objectName = data.visit.object_name || 'Объект'

    await resend.emails.send({
      from: 'nadzor@brickburo.com',
      to: recipients,
      subject: `Журнал авторского сопровождения — ${objectName} — Визит № ${visitNum}`,
      html: `
        <p>Добрый день,</p>
        <p>во вложении — журнал авторского сопровождения по объекту <b>${objectName}</b>, визит № ${visitNum}.</p>
        <p>—<br>Brick Buro · Авторский надзор<br>brickburo.com</p>
      `,
      attachments: [{
        filename: `Brick_Buro_АС_${objectName}_визит${visitNum}.pdf`,
        content: Buffer.from(pdf).toString('base64'),
      }],
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
