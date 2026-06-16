const OSS = require('ali-oss')
const fs = require('fs')
const path = require('path')

const accessKeyId = process.env.OSS_ACCESS_KEY_ID
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
const BUCKET = 'blindpick'
const REGION = 'oss-cn-hangzhou'

async function main() {
  const client = new OSS({ region: REGION, accessKeyId, accessKeySecret, bucket: BUCKET })

  console.log('📤 上传 index.html...')
  await client.put('index.html', fs.readFileSync(path.join(__dirname, 'index.html')), {
    mime: 'text/html; charset=utf-8',
    headers: { 'Cache-Control': 'no-cache' }
  })
  console.log('✅ 上传完成')

  console.log('')
  console.log('🎉 部署成功！访问地址：')
  console.log('   https://blindpick.oss-cn-hangzhou.aliyuncs.com/index.html')
}

main().catch(err => {
  console.error('❌ 失败:', err.code, err.message)
  process.exit(1)
})
