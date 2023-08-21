import SIM800, { SIM800Options } from "../sim800";

const PORT = '/dev/ttyUSB0';
const CONFIG = {
  baudRate: 115200,
}

test('test SIM800 Instantiation', async () => {
  const sim800 = new SIM800(PORT, CONFIG);

  const isOpen = await sim800.open();
  expect(isOpen).toBe(true);
  expect(sim800.isOpen()).toBe(true);

  sim800.close();
});
