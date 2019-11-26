'use strict'

/* eslint camelcase: "off" */

const axios = require('axios')
const { client_id, client_secret, redirect_uri } = require('../config')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const crypto = require('crypto')
const express = require('express')
const path = require('path')
const qs = require('querystring')

const authorization = 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
const headers = { authorization }
const scope = 'user-read-private user-read-email'
const stateKey = 'spotify_auth_state'

const app = express()

app.use(express.static(path.join(__dirname, 'public')))
  .use(cors())
  .use(cookieParser())

app.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')
  res.cookie(stateKey, state)

  const query = qs.stringify({
    response_type: 'code',
    client_id,
    scope,
    redirect_uri,
    state
  })

  const url = 'https://accounts.spotify.com/authorize?' + query

  res.redirect(url)
})

app.get('/callback', async (req, res) => {
  const code = req.query.code || null
  const state = req.query.state || null
  const storedState = req.cookies ? req.cookies[stateKey] : null

  if (state === null || state !== storedState) {
    const query = qs.stringify({ error: 'state_mismatch' })
    return res.redirect('/?' + query)
  }

  const url = 'https://accounts.spotify.com/api/token'

  const params = new URLSearchParams({
    code,
    redirect_uri,
    grant_type: 'authorization_code'
  })

  try {
    const { data: { access_token, refresh_token } } = await axios.post(url, params, { headers })
    const query = qs.stringify({ access_token, refresh_token })
    res.redirect('/?' + query)
  } catch (err) {
    console.error(err.message)
    const query = qs.stringify({ error: 'invalid_token' })
    res.redirect('/?' + query)
  }
})

app.get('/refresh_token', async (req, res) => {
  const url = 'https://accounts.spotify.com/api/token'

  const data = {
    grant_type: 'refresh_token',
    refresh_token: req.query.refresh_token
  }

  try {
    const { data: { access_token } } = await axios.post(url, data, { headers })
    res.send({ access_token })
  } catch (err) {
    console.error(err.message)
  }
})

app.listen(8888, () => console.log('Server listening on 8888'))
