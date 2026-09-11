interface Env {
  ALLOWED_ORIGINS: string
}

const upstream = 'https://github.com'
const allowedPaths = new Set(['/login/device/code', '/login/oauth/access_token'])

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const allowedOrigin = env.ALLOWED_ORIGINS
      .split(',')
      .map((value) => value.trim())
      .find((value) => value === origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: allowedOrigin ? 204 : 403, headers: corsHeaders(allowedOrigin) })
    }

    const path = new URL(request.url).pathname
    if (request.method !== 'POST' || !allowedPaths.has(path) || !allowedOrigin) {
      return new Response('Not found', { status: 404, headers: corsHeaders(allowedOrigin) })
    }

    const response = await fetch(`${upstream}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: await request.text(),
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...corsHeaders(allowedOrigin),
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
      },
    })
  },
}

const corsHeaders = (origin: string | undefined): HeadersInit => ({
  ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  Vary: 'Origin',
})
