'use strict'

const express = require('express')
const path = require('path')

const app = express()

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(8888, () => console.log('Server listening on 8888'))
