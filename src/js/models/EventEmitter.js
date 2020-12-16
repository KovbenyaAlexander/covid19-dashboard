class EventEmitter {
  constructor() {
    this.evnts = {};
  }

  on(evt, listener) {
    (this.evnts[evt] || (this.evnts[evt] = [])).push(listener);
    return this;
  }

  emit(evt, arg) {
    (this.evnts[evt] || []).slice().forEach((lsn) => lsn(arg));
  }
}

export default EventEmitter;
