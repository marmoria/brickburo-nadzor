import { NextRequest, NextResponse } from 'next/server'
import { buildPdfHtml } from '@/lib/pdf-template'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const html = buildPdfHtml(data)

    let chromium: any
    let puppeteer: any

    if (process.env.NODE_ENV === 'production') {
      chromium = (await import('@sparticuz/chromium')).default
      puppeteer = (await import('puppeteer-core')).default
    } else {
      puppeteer = (await import('puppeteer')).default
    }

    const browser = await puppeteer.launch(
      process.env.NODE_ENV === 'production'
        ? { args: chromium.args, executablePath: await chromium.executablePath(), headless: true }
        : { headless: true }
    )

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })

    await browser.close()

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AS_vizit_${data.visit.visit_number || 1}.pdf"`,
      },
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
