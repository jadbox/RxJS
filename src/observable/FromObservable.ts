import {isArray} from '../util/isArray';
import {isFunction} from '../util/isFunction';
import {isPromise} from '../util/isPromise';
import {isScheduler} from '../util/isScheduler';
import {PromiseObservable} from './PromiseObservable';
import {IteratorObservable} from'./IteratorObservable';
import {ArrayObservable} from './ArrayObservable';
import {ArrayLikeObservable} from './ArrayLikeObservable';

import {Scheduler} from '../Scheduler';
import {SymbolShim} from '../util/SymbolShim';
import {Observable} from '../Observable';
import {Subscriber} from '../Subscriber';
import {ObserveOnSubscriber} from '../operator/observeOn';

const isArrayLike = (<T>(x: any): x is ArrayLike<T> => x && typeof x.length === 'number');

export class FromObservable<T> extends Observable<T> {
  constructor(private ish: Observable<T> | Promise<T> | Iterator<T> | ArrayLike<T>, private scheduler: Scheduler) {
    super(null);
  }

  static create<T>(ish: any, mapFnOrScheduler: Scheduler | ((x: any, y: number) => T), thisArg?: any, lastScheduler?: Scheduler): Observable<T> {
    let scheduler: Scheduler = null;
    let mapFn: (x: number, y: any) => T = null;
    if (isFunction(mapFnOrScheduler)) {
      scheduler = lastScheduler || null;
      mapFn = <(x: number, y: any) => T> mapFnOrScheduler;
    } else if (isScheduler(scheduler)) {
      scheduler = <Scheduler> mapFnOrScheduler;
    }

    if (ish != null) {
      if (typeof ish[SymbolShim.observable] === 'function') {
        if (ish instanceof Observable && !scheduler) {
          return ish;
        }
        return new FromObservable(ish, scheduler);
      } else if (isArray(ish)) {
        return new ArrayObservable(ish, scheduler);
      } else if (isPromise(ish)) {
        return new PromiseObservable(ish, scheduler);
      } else if (typeof ish[SymbolShim.iterator] === 'function' || typeof ish === 'string') {
        return new IteratorObservable<T>(<any>ish, null, null, scheduler);
      } else if (isArrayLike(ish)) {
        return new ArrayLikeObservable(ish, mapFn, thisArg, scheduler);
      }
    }

    throw new TypeError((ish !== null && typeof ish || ish) + ' is not observable');
  }

  protected _subscribe(subscriber: Subscriber<T>) {
    const ish = this.ish;
    const scheduler = this.scheduler;
    if (scheduler == null) {
      return ish[SymbolShim.observable]().subscribe(subscriber);
    } else {
      return ish[SymbolShim.observable]().subscribe(new ObserveOnSubscriber(subscriber, scheduler, 0));
    }
  }
}
