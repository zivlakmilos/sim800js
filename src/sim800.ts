import { SerialPort } from "serialport";

export type SIM800Options = {
  baudRate?: number,
}

class SIM800 {
  private tty: SerialPort;

  constructor(private port: string, private options: SIM800Options | undefined = undefined) {
    this.tty = new SerialPort({
      path: port,
      baudRate: options?.baudRate || 9600,
      autoOpen: false,
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

  close(): void {
    this.tty.close();
  }

  sendMessage(phone: string, txt: string): boolean {
    return false;
  }
}

export default SIM800;
