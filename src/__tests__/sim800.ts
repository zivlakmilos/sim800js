import SIM800, { SIM800Options } from "../sim800";

const PORT = '/dev/ttyUSB0';
const CONFIG = {
  baudRate: 115200,
}

describe('test SIM800', () => {
  const sim800 = new SIM800(PORT, CONFIG);

  test('test SIM800 Instantiation', async () => {
    const isOpen = await sim800.open();
    expect(isOpen).toBe(true);
    expect(sim800.isOpen()).toBe(true);
  });

  test('test SIM800 Handshake', async () => {
    const handshake = await sim800.sendHandshake();
    expect(handshake).toBe(true);
  });

  test('test SIM800 Send SMS', async () => {
  });

  test('test SIM800 List SMS', async () => {
  });

  test('test SIM800 Read SMS', async () => {
  });

  test('test SIM800 Close', async () => {
    const isClosed = await sim800.close();
    expect(isClosed).toBe(true);
    expect(sim800.isOpen()).toBe(false);
  });
});
