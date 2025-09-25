import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import * as CryptoJS from 'crypto-js';
import { Storage } from '@ionic/storage-angular';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private dbInstance: SQLiteObject | null = null;
  private currentUser: any;

   // Replace with your FastAPI EC2 endpoint
  private apiUrl = 'http://3.106.132.173:8000/api/registrations';


  constructor(private sqlite: SQLite, private platform: Platform,  private storage: Storage, private http: HttpClient) {
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      if (!this.platform.is('hybrid')) {
        console.warn('Not running on hybrid platform — SQLite is not available.');
        return;
      }

      const db = await this.sqlite.create({
        name: 'barangayconnect.db',
        location: 'default',
      });

      this.dbInstance = db;

      await db.executeSql(
        `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT,
          middleName TEXT,
          lastName TEXT,
          dob TEXT,
          gender TEXT,
          civilStatus TEXT,
          contact TEXT UNIQUE,
          purok TEXT,
          barangay TEXT,
          city TEXT,
          province TEXT,
          postalCode TEXT,
          password TEXT,
          photo TEXT,
          role TEXT
        )
      `,
        []
      );
    } catch (error) {
      console.error('SQLite init error:', error);
    }
  }
  
  async saveOnlineRegistration(data: any): Promise<void> {
    try {
      // Encrypt password before sending
      const hashedPassword = CryptoJS.SHA256(data.password).toString();

      const payload = {
        ...data,
        password: hashedPassword,
        role: data.role || 'resident'
      };

      const response = await lastValueFrom(this.http.post(this.apiUrl, payload));
      console.log('✅ Online registration success:', response);
    } catch (error) {
      console.error('❌ Online registration failed:', error);
    }
  }

  async saveOfflineRegistration(data: any): Promise<void> {
    if (!this.dbInstance) {
      console.error('Database is not initialized');
      return;
    }

    const hashedPassword = CryptoJS.SHA256(data.password).toString();

    const query = `
      INSERT INTO users (
        firstName, middleName, lastName, dob, gender, civilStatus, contact, purok,
        barangay, city, province, postalCode, password, photo, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.firstName, data.middleName, data.lastName, data.dob,
      data.gender, data.civilStatus, data.contact, data.purok,
      data.barangay, data.city, data.province, data.postalCode,
      hashedPassword, data.photo, data.role || 'resident'
    ];

     console.log('📥 Attempting to insert into SQLite:', values);

    try {
    const result = await this.dbInstance.executeSql(query, values);
    console.log('✅ Insert result:', result);

    if (result.rowsAffected === 1) {
      console.log('✅ User inserted successfully.');
    } else {
      console.warn('⚠️ Insert did not affect any rows.');
    }

 } catch (error: unknown) {
  const err = error as Error;
  console.error('❌ Insert error:', err.message || err);
}

  }

  async getAllRegistrations(): Promise<any[]> {
    if (!this.dbInstance) {
      console.warn('getAllRegistrations: Database not available.');
      return [];
    }

    const result = await this.dbInstance.executeSql('SELECT * FROM users', []);
    const registrations = [];
    for (let i = 0; i < result.rows.length; i++) {
      registrations.push(result.rows.item(i));
    }
    return registrations;
  }

  async isDuplicateContact(contact: string): Promise<boolean> {
    if (!this.dbInstance) {
      console.warn('isDuplicateContact: Database not available.');
      return false;
    }

    const result = await this.dbInstance.executeSql(
      'SELECT * FROM users WHERE contact = ?',
      [contact]
    );
    return result.rows.length > 0;
  }

  async isDuplicateName(first: string, middle: string, last: string): Promise<boolean> {
    if (!this.dbInstance) {
      console.warn('isDuplicateName: Database not available.');
      return false;
    }

    const result = await this.dbInstance.executeSql(
      'SELECT * FROM users WHERE lower(firstName) = ? AND lower(middleName) = ? AND lower(lastName) = ?',
      [first.toLowerCase(), middle.toLowerCase(), last.toLowerCase()]
    );
    return result.rows.length > 0;
  }

  async updateUser(user: any): Promise<void> {
    if (!this.dbInstance) {
      console.warn('updateUser: Database not available.');
      return;
    }

    const query = `
      UPDATE users SET
        firstName = ?, middleName = ?, lastName = ?, dob = ?, gender = ?, civilStatus = ?,
        contact = ?, purok = ?, barangay = ?, city = ?, province = ?, postalCode = ?,
        password = ?, photo = ?
      WHERE id = ?
    `;

    const values = [
      user.firstName,
      user.middleName,
      user.lastName,
      user.dob,
      user.gender,
      user.civilStatus,
      user.contact,
      user.purok,
      user.barangay,
      user.city,
      user.province,
      user.postalCode,
      user.password,
      user.photo,
      user.id
    ];

    await this.dbInstance.executeSql(query, values);
  }

  async checkLogin(contact: string, password: string): Promise<any | null> {
    const hashed = CryptoJS.SHA256(password).toString();

    // 1. Try SQLite login
    if (this.dbInstance) {
      try {
        const result = await this.dbInstance.executeSql(
          'SELECT * FROM users WHERE contact = ? AND password = ?',
          [contact, hashed]
        );

        if (result.rows.length > 0) {
          return result.rows.item(0);
        }
      } catch (err) {
        console.error('SQLite checkLogin error:', err);
      }
    } else {
      console.warn('SQLite not available. Using fallback storage.');
    }

    // 2. Try fallback Ionic Storage
    // const storage = (await import('@ionic/storage-angular')).Storage;
    // const storageInstance = new storage();
    // await storageInstance.create();

   const secretary = await this.storage.get('secretary');
  const captain = await this.storage.get('captain');

    if (secretary && secretary.phone === contact && secretary.password === hashed) {
      return { ...secretary, role: 'secretary' };
    }

    if (captain && captain.phone === contact && captain.password === hashed) {
      return { ...captain, role: 'captain' };
    }

    return null;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async clearAll(): Promise<void> {
    if (!this.dbInstance) {
      console.warn('clearAll: Database not available.');
      return;
    }
    await this.dbInstance.executeSql('DELETE FROM users', []);
  }
}
