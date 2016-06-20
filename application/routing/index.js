const express = require('express')
const router = express.Router();
const bodyParser = require('body-parser')

function register(name, schema) {
  // Register Resource Routes
  router
    .get(`/${name}`, (req, res) => {
      console.log(req.query)
      res.send(`Getting ${name}`)
    })
    .get(`/${name}/:id`, (req, res) => {
      res.send(`Getting ${name}/${req.params.id}`)
    })
    .post(`/${name}`, (req, res) => {
      res.send(`Posting ${name}`)
    })
    .put(`/${name}/:id`, (req, res) => {
      res.send(`Putting ${name}/${req.params.id}`)
    })
    .patch(`/${name}/:id`, (req, res) => {
      res.send(`Patching ${name}/${req.params.id}`)
    })
  // Register Schema Route
  router
    .get(`/info/${name}`, (req, res) => {
      res.send(schema)
    })

  return router
}

module.exports = register