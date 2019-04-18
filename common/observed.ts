import { Obj } from './util';

export const obsSym = Symbol("observedObject");

export interface Observed<T> {
  prox: T; // Proxy<any>,
  subs: Cb[];
  parent: Observed<any> | any;
  parentRef: Observed<any> | any;
  fullPath: string;
  emit(path: string, evt: Event): void;
  sub(cb: Cb): () => void;
  raw: T;
}

interface ObservedObj extends Obj {
  [obsSym]: Observed<this>;
}

export interface Event {
  type: string;
  path?: string;
  [key: string]: any;
}

interface Cb {
  (evt: Event): void;
}

export function createObserved<T extends Obj = {}>(
  obj: T,
  par?: Observed<any>,
  path?: string
): T {
  const obs: Observed<T> = (obj as any)[obsSym] || ((obj as any)[obsSym] = {
    prox: new Proxy(obj, {
      get(target, prop) {
        if (prop === obsSym) return obs;
        if (typeof prop === "symbol") return target[prop as any];
        const res = target[prop];
        if (
          typeof res === "object" &&
          !(obsSym in res) &&
          !(res instanceof Date)
        ) {
          const prox = createObserved(res, obs, obs.fullPath + "/" + prop);
          subscribe(prox, obs.emit.bind(obs, prop.toString()));
          return prox;
        }
        return typeof res === "object" ? res[obsSym] && res[obsSym].prox || res : res;
      },
      set(target, prop, value) {
        if (
          typeof prop !== "symbol" &&
          typeof value === "object" &&
          !(obsSym in value) &&
          !(value instanceof Date)
        ) {
          value = createObserved(value, obs, obs.fullPath + "/" + prop);
          subscribe(value, obs.emit.bind(obs, prop.toString()));
        }
        target[prop as any] = value;
        if (typeof prop !== "symbol")
          obs.emit("" + prop, {
            type: "patch",
            value
          });
        return true;
      }
    }),
    emit: (path: string, evt: Event) => {
      const nEvt = Object.assign({}, evt, {
        path: "/" + path + (evt.path || "")
      });

      let i = 0,
        len = obs.subs.length;
      for (; i < len; i++) obs.subs[i](nEvt);
    },
    get parent() {
      if (obs.parentRef) {
        const parent = obs.parentRef;
        const parPath = parent.path;
        const relPath = obs.fullPath.match(new RegExp(`^${parPath}/(.+)$`));
        if (!relPath || !relPath[1] || parent.prox[relPath[1]] !== obs.prox) {
          obs.parentRef = null;
          obs.fullPath = "/";
          return null;
        }
        return parent;
      }
      return null;
      obs.parentRef;
    },
    parentRef: par || null,
    fullPath: path || "/",
    subs: [],
    sub: (cb: Cb) => {
      obs.subs.push(cb);
      return () => {
        obs.subs.splice(obs.subs.indexOf(cb), 1);
      };
    },
    raw: obj
  });
  return obs.prox;
}

export function subscribe(obs: Obj, cb: Cb) {
  if (!(obs as ObservedObj)[obsSym]) throw new Error("not and observed object");

  return (obs as ObservedObj)[obsSym].sub(cb);
}

export function silentDset(obj: Obj, path: string[], val: any) {
  let curr = obj,
    i = 0,
    len = path.length;
  for (; i < len; i++) {
    const key = path[i];
    const raw = obsSym in curr ? curr[obsSym as any].raw : curr;
    console.log(raw);

    if (i == len - 1) {
      raw[key] = val;
    } else curr = raw[key];
  }
}

