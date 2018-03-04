class Logger {
  constructor(stream) {
    this._stream = stream || process.stdout;
  }

  log(...messages) {
    messages.forEach(message => this._stream.write(message));
  }

  get stream() {
    return this._stream;
  }

  set stream(stream) {
    this._stream = stream;
  }
}

class ErrorLogger extends Logger {
  constructor(stream) {
    super(stream || process.stderr);
  }
}

module.exports = {
  Logger: Logger,
  ErrorLogger: ErrorLogger
};
