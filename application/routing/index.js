const express = require('express')
const router = new express.Router()


function routing(schema) {
  router
    .get('/info', (req, res) => {
      res.send(schema)
    })
    .get('/info/:name', (req, res) => {
      res.send(schema[req.params.name])
    })
    .get('/:name', (req, res) => {
      req.db.find(req.params.name)
      .then((results) => {
        res.send(results)
      })
    })
    .get('/:name/:id', (req, res) => {
      const { params, db } = req
      db.find(params.name, params.id).then(results => {
        res.send(results)
      }, err => res.send(err))
    })
    .post('/:name', (req, res) => {
      const { body, db, params } = req
      db.insert(params.name, body)
      .then(data => res.send(data), err => res.send(err))
    })
    .put('/:name/:id', (req, res) => {
      res.send(req.params)
    })
    .patch('/:name/:id', (req, res) => {
      res.send(req.params)
    })
  return router
}

module.exports = routing
