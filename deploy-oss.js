const OSS = require('ali-oss')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const REGION = process.env.OSS_REGION || 'oss-cn-shenzhen'
const BUCKET = process.env.OSS_BUCKET || 'blindpick-' + crypto.randomBytes(4).toString('hex')

async function main() {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET

  if (!accessKeyId || !accessKeySecret) {
    console.error('请设置环境变量:')
    console.error('  export OSS_ACCESS_KEY_ID=你的AccessKey ID')
    console.error('  export OSS_ACCESS_KEY_SECRET=你的AccessKey Secret')
    console.error('  export OSS_REGION=oss-cn-shenzhen  (可选，默认深圳)')
    console.error('  export OSS_BUCKET=你的bucket名      (可选，自动生成)')
    process.exit(1)
  }

  console.log(`🚀 开始部署到阿里云 OSS...`)
  console.log(`   Region: ${REGION}`)
  console.log(`   Bucket: ${BUCKET}`)

  // 1. 创建 client（管理操作用内网 endpoint）
  const client = new OSS({
    region: REGION,
    accessKeyId,
    accessKeySecret,
    bucket: BUCKET
  })

  // 2. 尝试创建 bucket
  try {
    await client.getBucketInfo()
    console.log('✅ Bucket 已存在')
  } catch (err) {
    if (err.code === 'NoSuchBucket' || err.code === 'AccessDenied') {
      console.log('📦 创建 Bucket...')
      await client.putBucket(BUCKET, { acl: 'public-read' })
      console.log('✅ Bucket 创建成功')
    } else {
      throw err
    }
  }

  // 3. 设置公共读
  await client.putBucketACL(BUCKET, 'public-read')
  console.log('✅ ACL 设置为 public-read')

  // 4. 开启静态网站托管
  await client.putBucketWebsite(BUCKET, {
    index: 'index.html',
    error: 'index.html'
  })
  console.log('✅ 静态网站托管已开启')

  // 5. 上传 index.html
  const filePath = path.join(__dirname, 'index.html')
  const content = fs.readFileSync(filePath)

  await client.put('index.html', content, {
    mime: 'text/html; charset=utf-8',
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  console.log('✅ index.html 上传完成')

  // 6. 输出访问地址
  const websiteUrl = `https://${BUCKET}.${REGION.replace('oss-', '')}.aliyuncs.com/index.html`
  const shortUrl = `http://${BUCKET}.${REGION}.aliyuncs.com`

  console.log('')
  console.log('🎉 部署成功！访问地址：')
  console.log(`   ${shortUrl}/index.html`)
  console.log('')
  console.log('💡 如需自定义域名，在 OSS 控制台绑定域名即可。')
}

main().catch(err => {
  console.error('❌ 部署失败:', err.message)
  process.exit(1)
})
