import { createServer, ServerResponse, IncomingMessage } from "http";
import * as WebSocket from "ws";
import { readFileSync, writeFileSync } from "fs";

import { connect } from '../common/sync';
import { Event } from '../common/observed';

function serve(_req: IncomingMessage, res: ServerResponse) {
  res.write("Test");
  res.end();
}

const server = createServer(serve);

const wss = new WebSocket.Server({
  server
});

function write(data: object) {
  writeFileSync("data.json", JSON.stringify(data));
}

function read(defaultVal: object) {
  try {
    return JSON.parse(readFileSync("data.json").toString());
  } catch (e) {
    write(defaultVal);
    return defaultVal;
  }
}

function broadcast(evt: Event) {
  wss.clients.forEach(ws => {
    ws.send(JSON.stringify(evt));
  })
}

const { obj: data, update } = connect(read({ test: true }), broadcast);

wss.on("connection", (ws: WebSocket) => {
  function json(data: object) {
    ws.send(JSON.stringify(data));
  }
  //connection is up, let's add a simple simple event
  ws.on("message", (message: string) => {
    //log the received message and send it back to the client
    console.log("received: %s", message);
    const payload = JSON.parse(message);
    update(payload);
    write(data);
    broadcast(payload);
  });

  //send immediatly a feedback to the incoming connection
  json({ type: "data", value: data });
});

server.listen(4321, () => {
  console.log("Server started on: ", server.address()!);
});
