const bcrypt = require('bcrypt')
const r = require('rethinkdb')
const jwt = require('jsonwebtoken')
const decodeToken = require('../../application/utils/helpers').decodeToken
const settings = require('../default_settings')

// passing a truthy param as 'force' will force authentication, even if disabled in settings. This is for unit testing purposes
function authenticate(force) {
  return (req, res, next) => {
    if (settings.AUTHENTICATION || force) {
      if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
        // Grab btoa string, decode, and separate username and password into variables
        const { username, password } = decodeToken(req.headers.authorization)
        // search for user in database
        r.table('accounts').filter({ username }).run(req.connection)
        .then(data => {
          Promise.resolve(data.toArray())
          .then(data => {
            // if results are an empty array
            if (!data.length) res.status(401).send('Invalid credentials')
            // check password
            bcrypt.compare(password, data[0].password, (err, resp) => {
              if (resp) {
                req.authenticated = true
                req.user = data[0]
                next()
              } else res.status(401).send('Invalid credentials')
            })
          })
        })
      } else {
        res.status(401).send('authorization required')
      }
    } else next()
  }
}

function checkToken(req, res, next) {
  if (settings.AUTHENTICATION) {
    const token = decodeToken(req.headers.authorization).password
    if (token) {
      /* eslint-disable no-unused-vars */
      jwt.verify(token, req.app.get('secret'), (err, decoded) => {
        if (err) {
          res.json({
            success: false,
            message: 'Failed to authenticate token',
          })
        } else {
          req.verified = true
          next()
        }
      })
    } else res.status(401).send('Invalid token')
  } else next()
}

module.exports = {
  authenticate,
  checkToken,
}
