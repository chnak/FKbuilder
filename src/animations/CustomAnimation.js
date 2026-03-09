import { Animation } from './Animation.js';

export class CustomAnimation extends Animation {
  constructor(config = {}) {
    super(config);
    this.type = 'custom';
    this.updateFn = config.update || null;
  }

  getStateAtTime(time, currentState = {}) {
    if (!this.updateFn) return {};

    const progress = this.getEasedProgress(time);
    const changes = {};

    const proxy = new Proxy(currentState, {
      get: (target, prop) => {
        return target[prop];
      },
      set: (target, prop, value) => {
        target[prop] = value;
        changes[prop] = value;
        return true;
      }
    });

    try {
      this.updateFn(progress, proxy);
    } catch (err) {
      console.warn('[CustomAnimation] Error in update function:', err);
    }

    return changes;
  }
}
