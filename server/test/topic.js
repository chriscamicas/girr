let server = require('../app')
let Program = require('../src/models/program')
let Episode = require('../src/models/episode')
let Topic = require('../src/models/topic')

// Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let should = chai.should()
let expect = chai.expect

chai.use(chaiHttp)

// Our parent block
describe('Topics', () => {
  let program, episode, topic

  /*
   * Before tests we empty the database
   * and create a fresh Episode to test Topics
   */
  before((done) => {
    Program.remove({}, (err) => { 
      program = new Program({
        name: "A program to test episodes",
        created: Date.now(),
        modified: Date.now()
      })
      program.save((err, savedProgram) => {
        episode = new Episode({
          name: "An episode to test topics",
          program: savedProgram.id,
          number: 1,
          created: Date.now(),
          modified: Date.now()
        })
        episode.save((err, savedEpisode) => {
          done()
        })
      })
    })
  })

  /*
   * Get all Episode's Topics
   */
  describe('GET /api/programs/:programId/episodes/:episodeId/topics', () => {
    it('it should GET all the Episode\'s Topics', (done) => {
      chai.request(server)
        .get(`/api/programs/${program._id}/episodes/${episode._id}/topics`)
        .end((err, res) => {
          expect(err).to.not.be.ok
          res.should.have.status(200)
          res.body.should.be.a('array').be.empty
          done()
        })
    })
  })

  /*
   * Add a new Topic to an Episode
   */
  describe('POST /api/programs/:programId/episodes/:episodeId/topics', () => {
    it('it should POST a new Topic', (done) => {
      chai.request(server)
        .post(`/api/programs/${program._id}/episodes/${episode._id}/topics`)
        .send({ title: 'A random title' })
        .end((err, res) => {
          expect(err).to.not.be.ok
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('_id').not.be.empty
          res.body.should.have.property('title')
          res.body.should.have.property('position').to.be.gt(0)
          res.body.should.have.property('created')
          res.body.should.have.property('modified').eql(res.body.created)
          res.body.should.have.property('medias').be.a('array').be.empty
          res.body.should.have.property('episode').eql(episode._id.toString())
          topic = res.body
          done()
        })
    })
  })

  /*
   * Get a single Topic
   */
  describe('GET /api/programs/:programId/episodes/:episodeId/topics/:id', () => {
    it('it should GET a Topic by the given id', (done) => {
      chai.request(server)
        .get(`/api/programs/${program._id}/episodes/${episode._id}/topics/${topic._id}`)
        .end((err, res) => {
          expect(err).to.not.be.ok
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('_id').eql(topic._id.toString())
          res.body.should.have.property('title').eql(topic.title)
          res.body.should.have.property('position').to.be.gt(0)
          res.body.should.have.property('created')
          res.body.should.have.property('modified').eql(res.body.created)
          res.body.should.have.property('medias').be.a('array').be.empty
          res.body.should.have.property('episode').eql(episode._id.toString())
          done()
        })
    })
  })

  /*
   * Update a single Topic
   */
  describe('PUT /api/programs/:programId/episodes/:episodeId/topics/:id', () => {
    it('it should UPDATE a Topic given the id', (done) => {
      data = {
        title: "A new title to test"
      }
      chai.request(server)
        .put(`/api/programs/${program._id}/episodes/${episode._id}/topics/${topic._id}`)
        .send(data)
        .end((err, res) => {
          expect(err).to.not.be.ok
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('_id').eql(topic._id.toString())
          res.body.should.have.property('title').eql(data.title)
          res.body.should.have.property('position').to.be.gt(0)
          res.body.should.have.property('created')
          res.body.should.have.property('modified').not.eql(res.body.created)
          res.body.should.have.property('medias').be.a('array')
          res.body.should.have.property('episode').eql(episode._id.toString())
          done()
        })
    })
  })

  /*
   * Start two topics successively
   */
  describe('GET /api/programs/:programId/episodes/:episodeId/topics/:id/start', () => {
    it('it should start a Topic and end all previously started', (done) => {
      chai.request(server)
        .post(`/api/programs/${program._id}/episodes/${episode._id}/topics`)
        .send({ title: 'A topic that should start' })
        .end((err, res) => {
          expect(err).to.not.be.ok
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('_id').not.be.empty
          chai.request(server)
            .get(`/api/programs/${program._id}/episodes/${episode._id}/topics/${res.body._id}/start`)
            .end((err, res) => {
              expect(err).to.not.be.ok
              res.should.have.status(200)
              res.body.should.be.a('object')
              res.body.should.have.property('_id').not.be.empty
              res.body.should.have.property('started').not.eql(null)
              res.body.should.have.property('ended').eql(null)
              let startedTopic = res.body
              chai.request(server)
                .get(`/api/programs/${program._id}/episodes/${episode._id}/topics/${topic._id}/start`)
                .end((err, res) => {
                  expect(err).to.not.be.ok
                  res.should.have.status(200)
                  res.body.should.be.a('object')
                  res.body.should.have.property('_id').eql(topic._id.toString())
                  res.body.should.have.property('started').not.eql(null)
                  res.body.should.have.property('ended').eql(null)
                  chai.request(server)
                    .get(`/api/programs/${program._id}/episodes/${episode._id}/topics/${startedTopic._id}`)
                    .end((err, res) => {
                      expect(err).to.not.be.ok
                      res.should.have.status(200)
                      res.body.should.be.a('object')
                      res.body.should.have.property('_id').eql(startedTopic._id.toString())
                      res.body.should.have.property('started').not.eql(null)
                      res.body.should.have.property('ended').not.eql(null)
                      done()
                    })
                })
            })
        })
    })
  })

  /*
   * Delete a single Topic
   */
  describe('DELETE /api/programs/:programId/episodes/:episodeId/topics/:id', () => {
    it('it should DELETE a Topic given the id', (done) => {
      chai.request(server)
        .delete(`/api/programs/${program._id}/episodes/${episode._id}/topics/${topic._id}`)
        .end((err, res) => {
          expect(err).to.not.be.ok
          res.should.have.status(204)
          res.body.should.be.empty
          done()
        })
    })
  })
})