const { expect } = require('chai');
const supertest = require('supertest');
const express = require('express');
const proxyHandler = require('./proxy-handler');

let sourceServer
let targetServer

function startTargetServer() {
  const app = express();

  app.post('/test', (req, res) => {
    expect(req.headers['x-foo']).to.equal('bar');
    expect(req.headers['remove-this-header']).to.be.undefined;
    
    res.status(200).end('OK');
  });

  return new Promise((resolve, reject) => {
    targetServer = app.listen(() => {
      resolve();
    });
  });
}

function startSourceServer() {
  const app = express();

  const targetUrl = `http://localhost:${targetServer.address().port}`;

  app.post('/test', proxyHandler(targetUrl));

  app.use((req, res, next) => {
    res.status(404).end('notfound :-(');
  })

  return new Promise((resolve, reject) => {
    sourceServer = app.listen(() => {
      resolve();
    });
  });
}

describe('Http-proxy without using nock for the back-end service', () => {
  before(() => 
    startTargetServer()
    .then(() => startSourceServer()));
  
  after(() => {
    targetServer.close();
    sourceServer.close();
  });

  it('should proxy a custom header to the target server', () => 
    supertest(sourceServer)
      .post('/test')
      .set('remove-this-header', 'yoyoyo')
      .send('hello http-proxy')
      .expect(200));
});
