const router = require('express').Router();
const WebhookResponse = require('@jambonz/node-client').WebhookResponse;

router.post('/', async(req, res) => {
  const {logger} = req.app.locals;
  logger.info({payload: req.body}, 'POST /millis');
  const opts = {
    agentId: process.env.MILLISAI_AGENT_ID,
    from: req.body.from,
    to: req.body.to,
    direction: req.body.direction,
    call_sid: req.body.call_sid
  };
  try {
    logger.info({opts}, 'opts');
    const app = new WebhookResponse();
    app
      .answer()
      .listen({
        url:  process.env.WS_URL,
        sampleRate: 16000,
        bidirectionalAudio: {
          enabled: true,
          streaming: true,
          sampleRate: 16000
        }
      });
    res.status(200).json(app);
  } catch (err) {
    logger.error({err}, 'Error');
    res.sendStatus(503);
  }
});

module.exports = router;
