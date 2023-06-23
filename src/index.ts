import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { basicAuth } from 'hono/basic-auth'
import { detectType } from './utils'

type Bindings = {
    BUCKET: R2Bucket
    USER: string
    PASS: string
}

const app = new Hono<{ Bindings: Bindings }>()
const maxAge = 60 * 60 * 24 * 30
const cacheName = "just-imgs"

// 设置缓存
app.get(
    '*',
    cache({
        cacheName: cacheName,
        cacheControl: `public, max-age=${maxAge}`,
    })
)

// 上传图片鉴权
app.put('/upload', async (c, next) => {
    const auth = basicAuth({ username: c.env.USER, password: c.env.PASS })
    await auth(c, next)
})

// 上传图片
app.put('/upload', async (c) => {
    const data = await c.req.json()

    const { body: base64, name } = data
    if (!base64) return c.notFound()

    const type = detectType(base64)
    if (!type) return c.notFound()

    const key = `${name}.${type.suffix}`
    const body = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

    await c.env.BUCKET.put(key, body, { httpMetadata: { contentType: type.mimeType } })

    return c.text(key)
})

app.get('/:key', async (c) => {
    const key = c.req.param('key')

    const object = await c.env.BUCKET.get(key)
    if (!object) return c.notFound()
    const data = await object.arrayBuffer()
    const contentType = object.httpMetadata?.contentType ?? ''

    return c.body(data, 200, {
        'Content-Type': contentType
    })
})

export default app
