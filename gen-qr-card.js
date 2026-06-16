const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

// 注册系统中文 PingFang 字体
const PINGFANG = '/System/Library/AssetsV2/com_apple_MobileAsset_Font8/86ba2c91f017a3749571a82f2c6d890ac7ffb2fb.asset/AssetData/PingFang.ttc'
try { GlobalFonts.registerFromPath(PINGFANG, 'PingFang') } catch(e) { console.log('字体注册失败，使用系统默认:', e.message) }

async function main() {
  const W = 680, H = 920
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')

  // ── 背景 ──
  const bg = ctx.createLinearGradient(0, 0, W * 0.5, H * 0.35)
  bg.addColorStop(0, '#FF7B42')
  bg.addColorStop(0.5, '#FF5E2C')
  bg.addColorStop(1, '#E84313')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 圆点纹理
  ctx.fillStyle = 'rgba(255,255,255,.1)'
  for (let x = 14; x < W; x += 18) {
    for (let y = 14; y < H; y += 18) {
      ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill()
    }
  }

  // 装饰圆
  ctx.strokeStyle = 'rgba(255,255,255,.06)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(W + 40, -80, 240, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(W + 60, -100, 300, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(-60, H - 180, 180, 0, Math.PI * 2); ctx.stroke()

  // ── Hero ──
  const heroCY = 155
  // emoji 环
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  ctx.beginPath(); ctx.arc(W / 2, heroCY, 58, 0, Math.PI * 2); ctx.fill()
  ctx.font = '52px PingFang'; ctx.textAlign = 'center'
  ctx.fillText('🥘', W / 2, heroCY + 18)

  ctx.font = 'bold 12px PingFang'; ctx.fillStyle = 'rgba(255,255,255,.7)'
  ctx.fillText('TODAY\'S PICK', W / 2, heroCY + 108)
  ctx.font = 'bold 48px PingFang'; ctx.fillStyle = 'white'
  ctx.fillText('盲选餐厅', W / 2, heroCY + 172)

  // ── 白色卡片区 ──
  const cardX = 26, cardY = 350, cardW = W - 52, cardH = H - cardY - 24, cardR = 24
  ctx.fillStyle = '#FFFBF5'
  ctx.beginPath()
  ctx.moveTo(cardX + cardR, cardY)
  ctx.lineTo(cardX + cardW - cardR, cardY)
  ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardR, cardR)
  ctx.lineTo(cardX + cardW, cardY + cardH - cardR)
  ctx.arcTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH, cardR)
  ctx.lineTo(cardX + cardR, cardY + cardH)
  ctx.arcTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR, cardR)
  ctx.lineTo(cardX, cardY + cardR)
  ctx.arcTo(cardX, cardY, cardX + cardR, cardY, cardR)
  ctx.closePath()
  ctx.fill()

  // 虚线
  ctx.strokeStyle = '#E8D5C4'; ctx.lineWidth = 1.5; ctx.setLineDash([7, 5])
  ctx.beginPath(); ctx.moveTo(cardX + 22, cardY); ctx.lineTo(cardX + cardW - 22, cardY); ctx.stroke()
  ctx.setLineDash([])

  // 描述
  ctx.font = 'bold 28px PingFang'; ctx.fillStyle = '#2D3436'; ctx.textAlign = 'center'
  ctx.fillText('今天吃什么？', W / 2, cardY + 54)
  ctx.font = '17px PingFang'; ctx.fillStyle = '#636E72'
  ctx.fillText('一键盲选周边 3km 好评餐厅，匹配你的口味', W / 2, cardY + 90)

  // ── QR Code ──
  const qrW = 252, qrX = (W - qrW) / 2, qrY = cardY + 118
  const qrDataUrl = await QRCode.toDataURL('https://bryanxu-bot.github.io/blindpick/', {
    width: qrW, margin: 2, color: { dark: '#E8551A', light: '#FFFBF5' }
  })
  const qrImg = await loadImage(qrDataUrl)
  ctx.drawImage(qrImg, qrX, qrY, qrW, qrW)

  ctx.font = '15px PingFang'; ctx.fillStyle = '#B2BEC3'
  ctx.fillText('📱 微信扫码 → 开始盲选', W / 2, qrY + qrW + 34)

  // ── 功能点 ──
  const featY = qrY + qrW + 72
  ctx.strokeStyle = '#F0E8DC'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(40, featY - 18); ctx.lineTo(W - 40, featY - 18); ctx.stroke()

  const feats = [
    { i:'📍', t:'周边3km' }, { i:'⭐', t:'好评筛选' },
    { i:'🎰', t:'盲盒惊喜' }, { i:'📤', t:'分享好友' }
  ]
  const gap = (W - 60) / feats.length
  feats.forEach((f, j) => {
    const fx = 30 + gap * j + gap / 2
    ctx.font = '28px PingFang'; ctx.textAlign = 'center'
    ctx.fillText(f.i, fx, featY + 18)
    ctx.font = '14px PingFang'; ctx.fillStyle = '#636E72'
    ctx.fillText(f.t, fx, featY + 48)
  })

  // 底部
  ctx.font = '12px PingFang'; ctx.fillStyle = '#B2BEC3'; ctx.textAlign = 'center'
  ctx.fillText('让每一餐都有惊喜', W / 2, H - 28)

  // Save
  const buf = canvas.toBuffer('image/png')
  const outPath = path.join(__dirname, 'qr-card.png')
  fs.writeFileSync(outPath, buf)
  console.log('✅ 已生成 qr-card.png (' + (buf.length / 1024).toFixed(0) + ' KB)')
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
