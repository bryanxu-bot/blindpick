const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

// 注册系统中文 PingFang 字体
const PINGFANG = '/System/Library/AssetsV2/com_apple_MobileAsset_Font8/86ba2c91f017a3749571a82f2c6d890ac7ffb2fb.asset/AssetData/PingFang.ttc'
try { GlobalFonts.registerFromPath(PINGFANG, 'PingFang') } catch(e) { console.log('字体注册失败，使用系统默认:', e.message) }

// 画一个碗/盘子的图标（避免 emoji 在 Node canvas 中乱码）
function drawPlateIcon(ctx, cx, cy, size) {
  const s = size / 2
  // 碗身
  ctx.fillStyle = 'rgba(255,255,255,.9)'
  ctx.beginPath()
  ctx.moveTo(cx - s, cy - s * 0.3)
  ctx.quadraticCurveTo(cx - s * 1.1, cy + s * 0.5, cx - s * 0.5, cy + s * 0.8)
  ctx.lineTo(cx + s * 0.5, cy + s * 0.8)
  ctx.quadraticCurveTo(cx + s * 1.1, cy + s * 0.5, cx + s, cy - s * 0.3)
  ctx.closePath()
  ctx.fill()
  // 碗口高光
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = s * 0.25
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.7, cy - s * 0.15)
  ctx.quadraticCurveTo(cx, cy + s * 0.1, cx + s * 0.7, cy - s * 0.15)
  ctx.stroke()
  // 热气
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = s * 0.15
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.moveTo(cx + i * s * 0.4, cy - s * 0.5)
    ctx.quadraticCurveTo(cx + i * s * 0.2, cy - s * 1.0, cx + i * s * 0.4, cy - s * 1.4)
    ctx.stroke()
  }
}

async function main() {
  const W = 720, H = 980
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')

  // Background
  const bg = ctx.createLinearGradient(0, 0, W * 0.5, H * 0.35)
  bg.addColorStop(0, '#FF7B42')
  bg.addColorStop(0.5, '#FF5E2C')
  bg.addColorStop(1, '#E84313')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Dot grid
  ctx.fillStyle = 'rgba(255,255,255,.06)'
  for (let x = 16; x < W; x += 24)
    for (let y = 16; y < H; y += 24) {
      ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill()
    }

  // Decorative arcs
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(W + 40, -80, 240, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(W + 60, -100, 300, 0, Math.PI * 2); ctx.stroke()

  // Hero
  const hY = 130
  // glow ring
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  ctx.beginPath(); ctx.arc(W / 2, hY, 58, 0, Math.PI * 2); ctx.fill()
  // drawn icon instead of emoji
  drawPlateIcon(ctx, W / 2, hY, 64)

  ctx.font = 'bold 12px PingFang'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.textAlign = 'center'
  ctx.fillText('TODAY\'S PICK', W / 2, hY + 95)
  ctx.font = 'bold 46px PingFang'; ctx.fillStyle = 'white'
  ctx.fillText('盲选餐厅', W / 2, hY + 155)

  // White card
  const cX = 28, cY = 320, cW = W - 56, cH = H - cY - 26, cardR = 26
  ctx.fillStyle = '#FFFBF5'
  ctx.beginPath()
  ctx.moveTo(cX + cardR, cY)
  ctx.lineTo(cX + cW - cardR, cY)
  ctx.arcTo(cX + cW, cY, cX + cW, cY + cardR, cardR)
  ctx.lineTo(cX + cW, cY + cH - cardR)
  ctx.arcTo(cX + cW, cY + cH, cX + cW - cardR, cY + cH, cardR)
  ctx.lineTo(cX + cardR, cY + cH)
  ctx.arcTo(cX, cY + cH, cX, cY + cH - cardR, cardR)
  ctx.lineTo(cX, cY + cardR)
  ctx.arcTo(cX, cY, cX + cardR, cY, cardR)
  ctx.closePath()
  ctx.fill()

  // Dashed divider
  ctx.strokeStyle = '#E8D5C4'; ctx.lineWidth = 1.5; ctx.setLineDash([7, 5])
  ctx.beginPath(); ctx.moveTo(cX + 24, cY); ctx.lineTo(cX + cW - 24, cY); ctx.stroke()
  ctx.setLineDash([])

  // Description
  ctx.font = 'bold 28px PingFang'; ctx.fillStyle = '#2D3436'; ctx.textAlign = 'center'
  ctx.fillText('今天吃什么？', W / 2, cY + 50)
  ctx.font = '17px PingFang'; ctx.fillStyle = '#636E72'
  ctx.fillText('一键盲选周边 3km 好评餐厅，匹配你的口味', W / 2, cY + 84)

  // QR
  const qrW = 240, qrX = (W - qrW) / 2, qrY = cY + 108
  const qrDataUrl = await QRCode.toDataURL('https://bryanxu-bot.github.io/blindpick/', {
    width: qrW, margin: 2, color: { dark: '#E8551A', light: '#FFFBF5' }
  })
  const qrImg = await loadImage(qrDataUrl)
  ctx.drawImage(qrImg, qrX, qrY, qrW, qrW)

  ctx.font = '14px PingFang'; ctx.fillStyle = '#B2BEC3'
  ctx.fillText('微信扫码 → 开始盲选', W / 2, qrY + qrW + 32)

  // Features
  const featY = qrY + qrW + 68
  ctx.strokeStyle = '#F0E8DC'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(50, featY - 16); ctx.lineTo(W - 50, featY - 16); ctx.stroke()

  const feats = [
    { i: '◉', t: '周边3km' },   // ◎
    { i: '★', t: '好评筛选' },   // ★
    { i: '◇', t: '盲盒惊喜' },   // ◇
    { i: '⇧', t: '分享好友' }    // ⇧
  ]
  const gap = (W - 60) / feats.length
  feats.forEach((f, j) => {
    const fx = 30 + gap * j + gap / 2
    ctx.font = '28px PingFang'; ctx.textAlign = 'center'
    ctx.fillText(f.i, fx, featY + 18)
    ctx.font = '14px PingFang'; ctx.fillStyle = '#636E72'
    ctx.fillText(f.t, fx, featY + 46)
  })

  // Footer
  ctx.font = '12px PingFang'; ctx.fillStyle = '#B2BEC3'; ctx.textAlign = 'center'
  ctx.fillText('让每一餐都有惊喜', W / 2, H - 28)

  const buf = canvas.toBuffer('image/png')
  const outPath = path.join(__dirname, 'qr-card.png')
  fs.writeFileSync(outPath, buf)
  console.log('✅ 已生成 qr-card.png (' + (buf.length / 1024).toFixed(0) + ' KB)')
  console.log('📍 ' + outPath)
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
