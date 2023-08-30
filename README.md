# sim800

NodeJS Library for SIM800 Module

Currently support only receiving and sending messages. Making and answering calls is not supported.



## Installation

Using npm:
```
npm install --save sim800
```

Using yarn:
```
yarn add sim800
```



## Ussage


### API

#### Import

ES6:

```javascript
import { SIM800 } from 'sim800js';
```

CommonJS:

```javascript
const { SIM800 } = require('sim800js');
```

#### Constructor

```javascript
  const sim800 = new SIM800('/dev/ttyUSB0');
```

#### Open

Open function don't accept arguments and return boolean promise.

true - success
false - failed

```javascript
open(): Promise<boolean>
```

#### Close

Close connection to sim800.

```javascript
close(): Promise<boolean>
```

true - success
false - failed

#### Handshake

Send AT command. Not required, but recommended to sync baud rate.

true - success
false - failed

```javascript
sendHandshake(): Promise<boolean>
```

#### Signal Quality

Get signal quality. Returns promise resolved to number from 0 to 30. Bigger is better.

```javascript
getSignalQuality(): Promise<number>
```

#### Sim Info

Get SIM info.

```javascript
getSimInfo(): Promise<string>
```

#### Send Message

Send SMS. First argument phone number starting with country code. Second argument message text.

true - success
false - failed

```
sendMessage(phone: string, text: string): Promise<boolean>
```

#### Receive Message

Register callback for receiving messages. Callback have two arguments. First is phone number, second is message text.

```
onReceiveMessage(callback: ReceiveMessageCallback): void
```


### Examples

```javascript
import { SIM800 } from 'sim800js';

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
````
