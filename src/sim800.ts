import { ReadlineParser, SerialPort } from "serialport";

export type SIM800Options = {
  baudRate?: number,
}

type Queue = {
  data: string,
  ignoreDelimeter?: boolean,
  callback?: (data: string) => void,
}

type ReceiveMessageCallback = (phone: string, text: string) => void;

class SIM800 {
  private tty: SerialPort;
  private parser: ReadlineParser;

  private queue: Queue[] = [];
  private current: Queue | undefined = undefined;
  private busy: boolean = false;

  private receiveMessageCallback?: ReceiveMessageCallback;
  private receivePhone?: string;

  constructor(private port: string, private options: SIM800Options | undefined = undefined) {
    this.tty = new SerialPort({
      path: port,
      baudRate: options?.baudRate || 9600,
      autoOpen: false,
      endOnClose: true,
    });

    this.parser = this.tty.pipe(new ReadlineParser({ delimiter: '\r\n', }));

    this.parser.on('data', data => {
      const trimData: string = data.trim();

      if (!trimData.length) {
        return;
      }

      if (trimData === 'Call Ready' || trimData === 'SMS Ready') {
        return;
      }

      if (trimData.at(0) === '+' && trimData.substring(0, 4) !== '+CSQ') {
        if (trimData.startsWith('+CMT')) {
          const split = trimData.split('"');
          if (split.length >= 1) {
            this.receivePhone = split[1];
          }
        }
        return;
      }

      if (this.receivePhone) {
        if (this.receiveMessageCallback) {
          this.receiveMessageCallback(this.receivePhone, trimData);
        }
        this.receivePhone = undefined;
        return;
      }

      if (this.current && this.current.data.replace(String.fromCharCode(0x1A), '') !== trimData && this.current.callback) {
        this.current.callback(trimData);
        this.current = undefined;
      }

      if (trimData === 'OK' || trimData === '>') {
        this.processQueue();
      }
    });
  }

  open(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.tty.open(err => {
        if (err) {
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }

  isOpen(): boolean {
    return this.tty.isOpen;
  }

  close(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.tty.close(err => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  sendHandshake(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.queue.push({
        data: 'AT',
        callback: (data: string) => {
          if (data === 'OK') {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      })
      if (!this.busy) {
        this.processQueue();
      }
    });
  }

  getSignalQuality(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.queue.push({
        data: 'AT+CSQ',
        callback: (data: string) => {
          const split = data.split(':');
          if (split.length < 1) {
            resolve(0);
          }
          resolve(parseFloat(split[1]));
        }
      })
      if (!this.busy) {
        this.processQueue();
      }
    });
  }

  getSimInfo(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.queue.push({
        data: 'AT+CCID',
        callback: (data: string) => {
          resolve(data);
        }
      })
      if (!this.busy) {
        this.processQueue();
      }
    });
  }

  sendMessage(phone: string, text: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.queue.push({
        data: 'AT+CMGF=1',
      });
      this.queue.push({
        data: `AT+CMGS="${phone}"`,
      });
      this.queue.push({
        data: `${text}${String.fromCharCode(0x1A)}`,
        ignoreDelimeter: true,
        callback: (data: string) => {
          console.log(data);
          if (data === 'OK') {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });

      if (!this.busy) {
        this.processQueue();
      }
    });
  }

  onReceiveMessage(callback: ReceiveMessageCallback): void {
    this.receiveMessageCallback = callback;

    this.queue.push({
      data: 'AT+CMGF=1',
    });
    this.queue.push({
      data: 'AT+CNMI=1,2,0,0,0',
    });
    if (!this.busy) {
      this.processQueue();
    }
  }

  private processQueue() {
    const next = this.queue.shift();
    this.current = next;
    if (!next) {
      this.busy = false;
      return;
    }

    this.busy = true;

    let data = next.data;
    if (!next.ignoreDelimeter) {
      data += '\r\n';
    }

    const buf = Buffer.from(data, 'ascii');
    console.log(buf);
    this.tty.write(buf);
  }
}

export default SIM800;
