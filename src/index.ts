import { connect } from '../common/sync';
import { Event } from '../common/observed';

const win = window as any;
win.data = null;
let update: null | ((evt: Event) => void) = null;

const ws = new WebSocket('ws://localhost:4321');
function json(data: object) {
  ws.send(JSON.stringify(data));
}
ws.onmessage = (msg) => {
  const payload = JSON.parse(msg.data);
  switch (payload.type) {
    case 'data': {
      const res = connect(payload.value, json);
      win.data = res.obj;
      update = res.update;
      break;
    }
    case 'patch': {
      update && update(payload);
      break;
    }
  }
};

