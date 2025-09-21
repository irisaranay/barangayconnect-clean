import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class DocumentRequestService {
  private dbInstance!: SQLiteObject;
  private apiUrl = 'http://3.106.132.173:8000'; // <-- Replace with your FastAPI AWS URL

  constructor(
    private sqlite: SQLite,
    private platform: Platform,
    private http: HttpClient
  ) {
    this.platform.ready().then(() => {
      this.initDatabase();
      // Auto sync when network is back
    Network.addListener('networkStatusChange', status => {
      if (status.connected) {
        console.log('🌐 Network connected, syncing unsynced requests...');
        this.syncUnsyncedRequests();
       }
    });
  });
}

  // ================= SQLite DB Initialization =================
  private async initDatabase(): Promise<void> {
    try {
      const db = await this.sqlite.create({
        name: 'barangayconnect.db',
        location: 'default',
      });
      this.dbInstance = db;

      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS document_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          documentType TEXT,
          purpose TEXT,
          copies INTEGER,
          requirements TEXT,
          photo TEXT,
          timestamp TEXT,
          status TEXT DEFAULT 'Pending',
          notes TEXT DEFAULT '',
          contact TEXT,
          isSynced INTEGER DEFAULT 0
        )
      `, []);
    } catch (error) {
      console.error('SQLite init error:', error);
    }
  }

  // ================= Core CRUD =================
  public getDb(): SQLiteObject {
    return this.dbInstance;
  }

  async addRequest(data: any): Promise<void> {
    if (!this.dbInstance) {
      console.warn('addRequest: DB not initialized.');
      return;
    }

    const query = `
      INSERT INTO document_requests (
        documentType, purpose, copies, requirements, photo, timestamp, status, notes, contact, isSynced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.documentType,
      data.purpose,
      data.copies,
      data.requirements,
      data.photo,
      data.timestamp,
      data.status || 'Pending',
      data.notes || '',
      data.contact,
      data.isSynced ?? 0
    ];

    try {
      await this.dbInstance.executeSql(query, values);
    } catch (error: any) {
      console.error('Insert error:', error.message || error);
    }
  }

  async getAllRequests(): Promise<any[]> {
    const result = await this.dbInstance.executeSql('SELECT * FROM document_requests', []);
    const requests: any[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      requests.push(result.rows.item(i));
    }
    return requests;
  }

  async getRequestsByContact(contact: string): Promise<any[]> {
    const result = await this.dbInstance.executeSql(
      'SELECT * FROM document_requests WHERE contact = ?',
      [contact]
    );
    const requests: any[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      requests.push(result.rows.item(i));
    }
    return requests;
  }

  async clearAll(): Promise<void> {
    await this.dbInstance.executeSql('DELETE FROM document_requests', []);
  }

  async rejectRequest(id: number, reason: string): Promise<void> {
    await this.dbInstance.executeSql(
      'UPDATE document_requests SET status = "Rejected", notes = ? WHERE id = ?',
      [reason, id]
    );
  }

  async cancelRequestById(id: number): Promise<void> {
    await this.dbInstance.executeSql(
      'UPDATE document_requests SET status = "Cancelled" WHERE id = ?',
      [id]
    );
  }

  async deleteRequestById(id: number): Promise<void> {
    await this.dbInstance.executeSql('DELETE FROM document_requests WHERE id = ?', [id]);
  }

  async updateStatus(id: number, newStatus: string): Promise<void> {
    await this.dbInstance.executeSql('UPDATE document_requests SET status = ? WHERE id = ?', [newStatus, id]);
  }

  async markAsSynced(id: number): Promise<void> {
    await this.dbInstance.executeSql('UPDATE document_requests SET isSynced = 1 WHERE id = ?', [id]);
  }

  async getSyncedRequests(): Promise<any[]> {
    const result = await this.dbInstance.executeSql('SELECT * FROM document_requests WHERE isSynced = 1', []);
    const synced: any[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      synced.push(result.rows.item(i));
    }
    return synced;
  }

  async getReleasedDocuments(): Promise<any[]> {
    const result = await this.dbInstance.executeSql(
      `SELECT * FROM document_requests WHERE status = 'For Pickup' OR status = 'Approved'`,
      []
    );
    const released: any[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      released.push(result.rows.item(i));
    }
    return released;
  }

  // ================= Sync with AWS FastAPI =================
  async syncUnsyncedRequests(): Promise<void> {
  try {
    // Get all unsynced requests
    const result = await this.dbInstance.executeSql('SELECT * FROM document_requests WHERE isSynced = 0', []);
    const unsynced: any[] = [];
    for (let i = 0; i < result.rows.length; i++) unsynced.push(result.rows.item(i));
    if (!unsynced.length) return;

      // Prepare payload for FastAPI
    const payload = unsynced.map(r => ({
      id: r.id,
      documentType: r.documentType,
      purpose: r.purpose,
      copies: r.copies,
      requirements: r.requirements || '',
      photo: r.photo || '',
      timestamp: r.timestamp,
      status: r.status || 'Pending',
      notes: r.notes || '',
      contact: r.contact,
      isSynced: r.isSynced ?? 0,
      clientId: r.id
    }));

      // Send to FastAPI
    const res: any = await lastValueFrom(this.http.post(`${this.apiUrl}/sync-requests/`, payload));

    // Mark all local rows as synced
    for (const r of unsynced) {
      await this.markAsSynced(r.id);
    }

    console.log('✅ All unsynced requests synced successfully.');

  } catch (err) {
    console.error('❌ Sync failed:', err);
  }
}
}