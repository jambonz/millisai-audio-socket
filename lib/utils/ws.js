const WebSocket = require('ws');

const pipeAudio = async(logger, socket) => {
  let millisSocket;
  let count = 0;

  const sendMillisAiData = (data, isBinary) => {
    if (millisSocket) {
      // send millis command
      if (!isBinary) {
        millisSocket.send(data);
      }
      // send millis audio data
      else if (isBinary && millisSocket.readyState === WebSocket.OPEN && millisSocket.ready) {
        millisSocket.send(data);
      }
    }

    if (++count >= 900) {
      count = 0;
      logger.info("Send Keep alive to Millis AI after 1000 packages");
      millisSocket.send(JSON.stringify({
        method: 'ping'
      }));
    }
  }

  socket.on('message', function(data, isBinary) {
    try {
      if (isBinary) {
        if (millisSocket && millisSocket.readyState === WebSocket.OPEN && millisSocket.ready) {
          sendMillisAiData(data, true);
        }
        return;
      }
      else {
        const obj = JSON.parse(data);
        if (!millisSocket) {
          logger.info(`received websocket connection from jambonz, start ws connection with millis`);
          millisSocket = new WebSocket(`wss://api-west.millis.ai:8080/millis`);

          millisSocket.on('open', () => {
            logger.info('Established MillisAi WebSocket connection, start sending Initial message');
            let initiateMessage = {
              method: "initiate",
              data: {
                agent: {
                  agent_id: process.env.MILLISAI_AGENT_ID,
                },
                public_key: process.env.MILLISAI_PUBLIC_KEY,
              }
            };
            sendMillisAiData(JSON.stringify(initiateMessage), false);
          });
          millisSocket.on('error', (err) => {
            logger.error({err}, 'Error with Lillisai WebSocket connection');
            cleanMillsWs();
          });
          millisSocket.on('close', (code, reason) => {
            logger.info(`MillisAi WebSocket connection closed with code: ${code}, reason: ${reason}`);
            socket.close();
            cleanMillsWs();
          });

          // Handle incoming messages from retellSocket
          millisSocket.on('message', (millisData, millisIsBinary) => {
            if (millisIsBinary) {
              // Send back audio to jambonz to play
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(millisData);
              }
            } else {
              // received response from MillisAi
              let message = JSON.parse(millisData);
              let msg;
              switch (message.method) {
                case "onready":
                  logger.debug('MillisAi Websocket connect is ready to send audio stream to Millis AI');
                  millisSocket.ready = true;
                  break;
                case "clear":
                  msg = JSON.stringify({"type": "killAudio"});
                  socket.send(msg);
                  break;
                case "ontranscript":
                  logger.info("Client's audio transcript:", message.data);
                  // msg = JSON.stringify({"type": "transcription", "transcript": message.data});
                  // socket.send(msg);
                  break;
                case "onsessionended":
                  logger.info("Session ended.");
                  socket.close();
                  cleanMillsWs();
                  break;
              }
            }
          });
        }

      }
    } catch (err) {
      logger.error({err}, `Error starting upload to bucket ${process.env.RECORD_BUCKET}`);
    }
  });

  const cleanMillsWs = () => {
    if (millisSocket) {
      millisSocket.close();
      millisSocket = null;
    }
  }
  socket.on('error', function(err) {
    logger.error({err}, 'recordAudio: error');
    cleanMillsWs();
  });
  socket.on('close', function(code, reason) {
    logger.info(`Jambonz WebSocket connection closed with code: ${code}, reason: ${reason}`);
    cleanMillsWs();
  });
};

module.exports = pipeAudio;
