import {Scheduler} from '../Scheduler';
import {Observable} from '../Observable';
import {Subscriber} from '../Subscriber';
import {Subscription} from '../Subscription';

export class ScalarObservable<T> extends Observable<T> {
  static create<T>(value: T, scheduler?: Scheduler): ScalarObservable<T> {
    return new ScalarObservable(value, scheduler);
  }

  static dispatch(state: any): void {
    const { done, value, subscriber } = state;

    if (done) {
      subscriber.complete();
      return;
    }

    subscriber.next(value);
    if (subscriber.isUnsubscribed) {
      return;
    }

    state.done = true;
    (<any> this).schedule(state);
  }

  _isScalar: boolean = true;

  constructor(public value: T, private scheduler?: Scheduler) {
    super();
  }

  protected _subscribe(subscriber: Subscriber<T>): Subscription | Function | void {
    const value = this.value;
    const scheduler = this.scheduler;

    if (scheduler) {
      return scheduler.schedule(ScalarObservable.dispatch, 0, {
        done: false, value, subscriber
      });
    } else {
      subscriber.next(value);
      if (!subscriber.isUnsubscribed) {
        subscriber.complete();
      }
    }
  }
}
