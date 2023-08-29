import SIM800 from 'sim800js';

const echo = async () => {
  const sim800 = new SIM800('/dev/ttyUSB0', {
    baudRate: 115200,
  });

  const isOpen = await sim800.open();
  if (isOpen) {
    console.log('Cannot open connection');
    return;
  }

  const handshake = await sim800.sendHandshake();
  if (!handshake) {
    console.log('Communication with SIM800 failed');
    return;
  }

  sim800.onReceiveMessage(async (phone, message) => {
    console.log(`Received ${message} from ${phone}`);
    const isOk = await sim800.sendMessage(phone, message);
    if (!isOk) {
      console.log(`Failed to send messgae ${message} to ${phone}`)
    }
  });
}
