import { ReadlineParser, SerialPort } from "serialport";

export type SIM800Options = {
  baudRate?: number,
}

type Queue = {
  data: string,
  callback: (data: string) => void,
}

class SIM800 {
  private tty: SerialPort;
  private parser: ReadlineParser;

  private queue: Queue[] = [];
  private current: Queue | undefined = undefined;

  constructor(private port: string, private options: SIM800Options | undefined = undefined) {
    this.tty = new SerialPort({
      path: port,
      baudRate: options?.baudRate || 9600,
      autoOpen: false,
      endOnClose: true,
    });

    this.parser = this.tty.pipe(new ReadlineParser({ delimiter: '\r\n', }));

    this.parser.on('data', data => {
      const trimData = data.trim();

      if (!this.current) {
        return;
      }
      if (this.current.data === trimData) {
        return;
      }

      this.current.callback(trimData);
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

  sendMessage(phone: string, txt: string): boolean {
    return false;
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
