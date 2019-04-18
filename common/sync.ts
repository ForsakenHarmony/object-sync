import { Obj } from './util';
import { Event, createObserved, subscribe, silentDset } from './observed';

//function createConn(initial: Obj) {
//  const objs: any[] = [];
//  const broadcast = (evt: Event) => {
//    objs.map(o => silentDset(o, evt.path.split("/").slice(1), evt.value));
//  };
//  const firstProx = createObserved(initial);
//  subscribe(firstProx, broadcast);
//  objs.push(firstProx);
//  const sub = () => {
//    const curr = JSON.parse(JSON.stringify(firstProx));
//    const prox = createObserved(curr);
//    subscribe(prox, broadcast);
//    objs.push(prox);
//    return prox;
//  };
//  return {
//    sub,
//    broadcast,
//    obj: firstProx
//  };
//}

export function connect(obj: Obj, send: (evt: Event) => void) {
  const proxied = createObserved(obj);
  subscribe(proxied, send);
  return {
    obj: proxied,
    update (evt: Event) {
      switch (evt.type) {
        case 'patch': {
          silentDset(proxied, evt.path!.split("/").slice(1), evt.value);
          break;
        }
      }
    },
  }
}

