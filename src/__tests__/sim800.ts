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

  test('test SIM800 Signal Quality', async () => {
    const signalQuality = await sim800.getSignalQuality();
    expect(signalQuality).toBeLessThanOrEqual(31);
  });

  test('test SIM800 Get SIM Info', async () => {
    const simInfo = await sim800.getSimInfo();
    expect(simInfo.length).toBeGreaterThan(5);
  });

  /*
  test('test SIM800 Send SMS', async () => {
    const isOk = await sim800.sendMessage('+xxxxxxxx', 'Test :D');
    expect(isOk).toBe(true);
  }, 60000);
  */

  test('test SIM800 Close', async () => {
    const isClosed = await sim800.close();
    expect(isClosed).toBe(true);
    expect(sim800.isOpen()).toBe(false);
  });
});
