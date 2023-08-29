import SIM800 from 'sim800';

const sendMessageExample = async () => {
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

  const phone = "+xxxxxxxx";
  const message = "Test :D"
  const isOk = await sim800.sendMessage('+xxxxxxxx', 'Test :D');
  if (!isOk) {
    console.log(`Failed to send messgae ${message} to ${phone}`)
    return;
  }

  console.log('Success!');
}
