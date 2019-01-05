const express = require('express')
const cors = require('cors')
const {makeRe} = require('extglob')
const safeStringify = require('fast-safe-stringify')
const {sse} = require('@toverux/expresse')

function OutputHTTP (config, eventEmitter) {
  this.config = config
  this.eventEmitter = eventEmitter
  this.app = express()
  this.app.use(cors())
  this.clients = new Set()
}

OutputHTTP.prototype.start = function () {
  this.eventEmitter.on('data.parsed', this.eventHandler.bind(this))

  this.app.set('env', 'production')
  this.app.get('/ping', (req, res) => res.end('logagent'))

  this.app.get('/events', (req, res, next) => {
    if (this.config.debug) {
      console.log('logagent-output-http: client connecting')
    }

    const client = {
      req,
      res,
      sourceFilter: req.query.source
        ? makeRe(req.query.source)
        : null
    }

    res.set('access-control-allow-origin', '*')
    res.once('close', () => this.clients.delete(client))
    res.once('finish', () => this.clients.delete(client))
    this.clients.add(client)
    next()
  }, sse({ serializer: safeStringify }))

  this.server = this.app.listen(this.config.port || 3000, this.config.address || '0.0.0.0', () => {
    if (this.config.debug) {
      console.log('logagent-output-http: server started')
    }
  })
}

OutputHTTP.prototype.stop = function (cb) {
  this.eventEmitter.removeListener('data.parsed', this.eventHandler)
  this.server.close()
  cb()
}

OutputHTTP.prototype.eventHandler = function (data, context) {
  if (this.config.suppress) {
    return
  }

  if (this.config.debug) {
    console.log('logagent-output-http: sending log data to %d client(s)',
                this.clients.size)
  }

  this.clients.forEach(c => {
    if (this.config.debug) {
      console.log('data', data)
    }
    if (!c.sourceFilter || c.sourceFilter.test(data.logSource)) {
      c.res.sse.event('message', data)
    }
  })
}

module.exports = OutputHTTP
