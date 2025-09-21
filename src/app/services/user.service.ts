import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js'; 
import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly SECRETARY_KEY = 'secretary';
  private readonly CAPTAIN_KEY = 'captain';

  constructor(private storage: Storage) {
    this.init();
  }

  public async init() {
    await this.storage.create();

    const hasSecretary = await this.storage.get(this.SECRETARY_KEY);
    if (!hasSecretary) {
      await this.storage.set(this.SECRETARY_KEY, {
        id: 1,
        name: 'Secretary',
        phone: '+639123456789',
        password: CryptoJS.SHA256('secret123').toString()
      });
    }

    const hasCaptain = await this.storage.get(this.CAPTAIN_KEY);
    if (!hasCaptain) {
      await this.storage.set(this.CAPTAIN_KEY, {
        id: 2,
        name: 'Captain',
        phone: '+639987654321', 
        password: CryptoJS.SHA256('captain123').toString() 
      });
    }
  }

  async getSecretary(): Promise<any> {
    return this.storage.get(this.SECRETARY_KEY);
  }

  async getCaptain(): Promise<any> {
    return this.storage.get(this.CAPTAIN_KEY);
  }
}
