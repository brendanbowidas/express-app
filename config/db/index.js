const r = require('rethinkdb')
const inspector = require('schema-inspector')
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  db: process.env.DB_NAME,
}

const methods = require('./methods')
// TODO: allow for validation of multiple objects
function validate(schema) {
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      // Hack to get the resource name because for some reason req.params is undefined here
      const param = req.originalUrl.replace('/api/v1/', '').split('/')[0]
      let iterations = 0
      for (const item of req.body) {
        iterations++
        const validation = inspector.validate(schema[param], item)
        console.log(validation)
        if (!validation.valid) {
          return res.status(400).send(validation.format())
        }
        if (iterations === req.body.length) return next()
      }
      /*  const validation = inspector.validate(schema[param], req.body)
      console.log(validation)
      if (validation.valid) {
      return next()
    }
    return res.status(400).send(validation.format()) */
    }
    return next()
  }
}

/**
* Determines if the Etag in the request matches the Etag in the database.
*
* @param {String} tableName
* @param {String} id
* @param {String} etag
* @param {Object} connection - the active connection to the database
* @returns {Promise|Boolean}
*/
function checkEtag(tableName, id, etag, connection) {
  return r.table(tableName).filter({ id }).run(connection)
  .then(cursor => cursor.next())
  .then(data => {
    if (data._etag === etag) return true
    return false
  })
}


function createConnection(req, res, next) {
  r.connect(dbConfig)
  .then((connection) => {
    req.connection = connection
    req.db = {
      find(tableName, id) {
        return methods.find(tableName, id, req, connection)
      },
      insert(tableName, data) {
        return methods.insert(tableName, data, connection)
      },
      update(tableName, id, data) {
        return checkEtag(tableName, id, req.headers['if-match'], connection)
        .then(match => {
          if (match) {
            return methods.update(tableName, id, data, connection)
          }
          return new Promise((resolve, reject) => reject('Etag mismatch'))
        })
      },
      replace(tableName, id, data) {
        return checkEtag(tableName, id, req.headers['if-match'], connection)
        .then(match => {
          if (match) {
            return methods.replace(tableName, id, data, connection)
          }
          return new Promise((resolve, reject) => reject('Etag mismatch'))
        })
      },
      delete(tableName, id) {
        return r.table(tableName).get(id).delete()
        .run(connection)
      },
    }
    next()
  })
}


function closeConnection(req, res, next) {
  req.connection.close()
  next()
}

module.exports = {
  createConnection,
  closeConnection,
  dbConfig,
  validate,
  checkEtag,

}
