import IPinProvider from '../models/IPinProvider';
import * as securePin from 'secure-pin';

class PinProvider implements IPinProvider {
  public async generatePin(): Promise<string> {
    const pin = await securePin.generatePinSync(4);
    return pin;
  }
}

export default PinProvider;
