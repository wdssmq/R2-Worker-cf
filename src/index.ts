import { Context, Hono } from 'hono'
import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
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

// 封装 json 返回
const jsonReturn = (c: Context, ok: boolean | number, data: any, msg: string) => {
    // 如果 ok 为数字，则为 http 状态码
    const code = typeof ok === 'number' ? ok : 200
    ok = typeof ok === 'boolean' ? ok : code < 400
    return c.json({
        ok,
        data,
        msg,
    }, code, {
        'Content-Type': 'application/json',
    })
}

// 设置跨域
app.use("*",
    cors({
        origin: ["*"],
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["*"],
        maxAge: 86400,
    })
)

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
    // console.log(base64);
    if (!base64) return jsonReturn(c, 400, null, 'base64 不能为空')

    const type = detectType(base64)
    // console.log(type);

    if (!type) return jsonReturn(c, 400, null, '不支持的图片格式')

    const key = name.indexOf(`.${type.suffix}`) > -1 ? name : `${name}.${type.suffix}`
    const body = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

    await c.env.BUCKET.put(key, body, { httpMetadata: { contentType: type.mimeType } })

    return jsonReturn(c, true, { key }, '上传成功')
})

app.get('/:key', async (c) => {
    const key = c.req.param('key')

    const object = await c.env.BUCKET.get(key)
    if (!object) return c.notFound()
    const data = await object.arrayBuffer()
    const contentType = object.httpMetadata?.contentType ?? ''

    return c.body(data, 200, {
        'Content-Type': contentType,
    })
})

app.get('/', async (c) => {

    const { objects } = await c.env.BUCKET.list({ prefix: '', limit: 10 })
    const data = objects.map((object) => {
        return {
            key: object.key,
            size: object.size,
        }
    })
    return jsonReturn(c, true, data, '获取成功')
})

export default app
