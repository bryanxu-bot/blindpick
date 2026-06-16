const OSS = require('ali-oss')

const accessKeyId = process.env.OSS_ACCESS_KEY_ID
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET

async function main() {
  const client = new OSS({
    region: 'oss-cn-hangzhou',
    accessKeyId,
    accessKeySecret
  })

  // 尝试列出所有 bucket（不绑定特定 bucket）
  try {
    const result = await client.listBuckets()
    console.log('✅ AccessKey 有效！')
    console.log('已有 Buckets:')
    if (result.buckets) {
      result.buckets.forEach(b => console.log(`  - ${b.name} (${b.region})`))
    }
    if (!result.buckets || result.buckets.length === 0) {
      console.log('  (无)')
    }
  } catch (err) {
    console.error('❌ 错误:', err.code, '-', err.message)
  }
}

main()
