const assert = require('assert');
assert.ok(process.env.MILLISAI_AGENT_ID, 'You must define the MILLISAI_AGENT_ID env variable');
assert.ok(process.env.MILLISAI_PUBLIC_KEY, 'You must define the MILLISAI_PUBLIC_KEY env variable');
assert.ok(process.env.JAMBONZ_ACCOUNT_SID, 'You must define the JAMBONZ_ACCOUNT_SID env variable');
assert.ok(process.env.JAMBONZ_API_KEY, 'You must define the JAMBONZ_API_KEY env variable');
assert.ok(process.env.JAMBONZ_REST_API_BASE_URL, 'You must define the JAMBONZ_REST_API_BASE_URL env variable');
assert.ok(process.env.WS_URL, 'You must define the WS_URL env variable');

const express = require('express');
const app = express();
const Websocket = require('ws');
const {WebhookResponse} = require('@jambonz/node-client');
const opts = Object.assign({
  timestamp: () => `, "time": "${new Date().toISOString()}"`,
  level: process.env.LOGLEVEL || 'debug'
});
const logger = require('pino')(opts);
const port = process.env.HTTP_PORT || 3000;


const routes = require('./lib/routes');
app.locals = {
  ...app.locals,
  logger,
  client: require('@jambonz/node-client')(
    process.env.JAMBONZ_ACCOUNT_SID,
    process.env.JAMBONZ_API_KEY,
    {
      baseUrl: process.env.JAMBONZ_REST_API_BASE_URL
    }
  ),
};

// WS Connection
const pipeAudio = require('./lib/utils/ws.js');
const wsServer = new Websocket.Server({ noServer: true, handleProtocols: (protocols, request) => {
  return 'audio.jambonz.org';
}});
wsServer.setMaxListeners(0);
wsServer.on('connection', pipeAudio.bind(null, logger));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
if (process.env.WEBHOOK_SECRET) {
  app.use(WebhookResponse.verifyJambonzSignature(process.env.WEBHOOK_SECRET));
}

app.use('/', routes);

app.use((err, _req, res) => {
  logger.error(err, 'burped error');
  res.status(err.status || 500).json({msg: err.message});
});


const server = app.listen(port, () => {
  logger.info(`Example jambonz app listening at http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit('connection', ws, request);
  });
});







