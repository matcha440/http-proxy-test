const { expect } = require('chai');
const supertest = require('supertest');
const express = require('express');
const proxyHandler = require('./proxy-handler');
const nock = require('nock');

const targetUrl = 'http://test.foo';
let sourceServer

function startSourceServer() {
  const app = express();

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

describe('Http-proxy using nock for the back-end service', () => {
  before(() => startSourceServer());
  
  after(() => {
    nock.cleanAll();
    sourceServer.close();
  });

  it('should proxy a custom header to the target server', () => {
    const scope = nock(targetUrl, {
      reqheaders: {
        'x-foo': 'bar'
      }
    }).post('/test', 'hello http-proxy')
      .reply(200, 'OK');

    return supertest(sourceServer)
      .post('/test')
      .set('remove-this-header', 'yoyoyo')
      .send('hello http-proxy')
      .expect(200)
      .expect(() => {
        expect(scope.isDone()).to.be.true;
      })
  });
});
