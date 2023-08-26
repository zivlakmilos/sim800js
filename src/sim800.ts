import { ReadlineParser, SerialPort } from "serialport";

export type SIM800Options = {
  baudRate?: number,
}

type Queue = {
  data: string,
  callback?: (data: string) => void,
}

type ReceiveMessageCallback = (phone: string, text: string) => void;

class SIM800 {
  private tty: SerialPort;
  private parser: ReadlineParser;

  private queue: Queue[] = [];
  private current: Queue | undefined = undefined;

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

      if (!this.current) {
        return;
      }
      if (this.current.data === trimData) {
        return;
      }

      if (this.current.callback) {
        this.current.callback(trimData);
      }
      this.processQueue();
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
      if (!this.current) {
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
      if (!this.current) {
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
      if (!this.current) {
        this.processQueue();
      }
    });
  }

  sendMessage(phone: string, text: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
    });
  }

  onReceiveMessage(callback: ReceiveMessageCallback): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.queue.push({
        data: 'AT+CFMG=1',
      });
      this.queue.push({
        data: 'AT+CNMI=2,1,0,0,0',
      });
      this.receiveMessageCallback = callback;
      if (!this.current) {
        this.processQueue();
      }
    });
  }

  private processQueue() {
    const next = this.queue.shift();
    this.current = next;
    if (!next) {
      return;
    }

    this.tty.write(next.data + '\r\n');
  }
}

export default SIM800;
