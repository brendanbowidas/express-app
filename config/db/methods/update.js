// @flow
const r = require('rethinkdb')
const md5 = require('md5')

function update(tableName: string, id: number, data: Object, connection: Object) : Promise<Object> {
  data._updated = r.now()
  data._etag = md5(JSON.stringify(data))
  return r.table(tableName).get(id).update(data, { returnChanges: true })
  .run(connection)
}

module.exports = update
