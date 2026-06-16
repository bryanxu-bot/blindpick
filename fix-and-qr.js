const OSS = require('ali-oss')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

const KEY_ID = process.env.OSS_ACCESS_KEY_ID
const KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET
const BUCKET = 'blindpick'
const REGION = 'oss-cn-hangzhou'
const URL = 'http://blindpick.oss-cn-hangzhou.aliyuncs.com/index.html'

async function main() {
  const client = new OSS({ region: REGION, accessKeyId: KEY_ID, accessKeySecret: KEY_SECRET, bucket: BUCKET })

  // 1. 删除并重新上传（去掉之前的 header 污染）
  console.log('📤 重新上传 index.html ...')
  await client.delete('index.html').catch(() => {})
  const html = fs.readFileSync(path.join(__dirname, 'index.html'))
  await client.put('index.html', html, {
    mime: 'text/html; charset=utf-8',
    headers: {
      'Content-Disposition': 'inline',      // 浏览器内渲染，不下载
    }
  })
  console.log('✅ 上传完成')

  // 2. 验证 header
  const http = require('http')
  await new Promise((resolve) => {
    http.get(URL, (res) => {
      console.log('Content-Type:', res.headers['content-type'] || '?')
      console.log('Content-Disposition:', res.headers['content-disposition'] || '(无)')
      const ok = !res.headers['x-oss-force-download']
      console.log(ok ? '✅ 浏览器会正常渲染' : '⚠️ 仍有问题')
      resolve()
    })
  })

  // 3. 生成二维码
  console.log('🎨 生成二维码 ...')
  await QRCode.toFile(path.join(__dirname, 'qr-scan.png'), URL, {
    width: 640,
    margin: 2,
    color: { dark: '#E8551A', light: '#FFF8F0' }
  })
  console.log('✅ qr-scan.png 已保存')

  // 4. 上传二维码到 OSS
  await client.put('qr.png', fs.readFileSync(path.join(__dirname, 'qr-scan.png')), {
    mime: 'image/png'
  })
  console.log('✅ 二维码已上传')

  console.log('')
  console.log('🔗 访问链接: ' + URL)
  console.log('📱 二维码图片: http://blindpick.oss-cn-hangzhou.aliyuncs.com/qr.png')
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
