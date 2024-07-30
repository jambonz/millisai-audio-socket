const router = require('express').Router();
const WebhookResponse = require('@jambonz/node-client').WebhookResponse;

router.post('/', async(req, res) => {
  const {logger} = req.app.locals;
  logger.info({payload: req.body}, 'POST /millis');
  try {
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
