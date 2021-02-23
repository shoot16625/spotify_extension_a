import express from 'express'
import request from 'request'
import cors from 'cors'
import querystring from 'querystring'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import dotEnv from 'dotenv'
dotEnv.config()

const clientId = process.env.CLIENT_ID // Your client id
const clientSecret = process.env.CLIENT_SECRET // Your secret
const redirectUri = process.env.CALLBACK_URL // Your redirect uri
const stateKey = 'spotify_auth_state'
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10000
})

const generateRandomString = function (length: number): string {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

const app: express.Express = express()

app
  .use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser())
  .use(limiter)

app.get('/login', function (req: express.Request, res: express.Response) {
  const state = generateRandomString(16)
  res.cookie(stateKey, state)

  const scope =
    'user-read-private user-read-email user-library-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-follow-read'

  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        state: state
      })
  )
})

app.get('/callback', function (req: express.Request, res: express.Response) {
  const code = req.query.code || null
  const state = req.query.state || null
  const storedState = req.cookies ? req.cookies[stateKey] : null

  if (state === null || state !== storedState) {
    res.redirect(
      '/#' +
        querystring.stringify({
          error: 'state_mismatch'
        })
    )
  } else {
    res.clearCookie(stateKey)
    const authOptions: request.Options = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      },
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      json: true
    }

    request.post(
      authOptions,
      function (error, response: request.Response, body) {
        if (!error && response.statusCode === 200) {
          const accessToken = body.access_token,
            refreshToken = body.refresh_token
          res.redirect(
            '/#' +
              querystring.stringify({
                access_token: accessToken,
                refresh_token: refreshToken
              })
          )
        } else {
          res.redirect(
            '/#' +
              querystring.stringify({
                error: 'invalid_token'
              })
          )
        }
      }
    )
  }
})

app.get(
  '/refresh_token',
  function (req: express.Request, res: express.Response) {
    const refreshToken = req.query.refresh_token
    const authOptions: request.Options = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      },
      json: true
    }

    request.post(
      authOptions,
      function (error, response: request.Response, body) {
        if (!error && response.statusCode === 200) {
          const accessToken = body.access_token
          res.send({
            access_token: accessToken
          })
        }
      }
    )
  }
)

console.log('listening on 8888')
app.listen(8888)
