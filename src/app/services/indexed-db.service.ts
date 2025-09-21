// src/app/services/indexed-db.service.ts
import { Injectable } from '@angular/core';
import { openDB } from 'idb';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'barangayconnect';
  private storeName = 'document_requests';

  async getAllRequests(): Promise<any[]> {
    const db = await openDB(this.dbName, 1);
    return await db.getAll(this.storeName);
  }

  async getRequestsByStatus(status: string): Promise<any[]> {
    const all = await this.getAllRequests();
    return all.filter(req => req.status === status);
  }

  async getRequestsToday(): Promise<any[]> {
    const today = new Date();
    const all = await this.getAllRequests();
    return all.filter(req => {
      const reqDate = new Date(req.timestamp);
      return (
        reqDate.getFullYear() === today.getFullYear() &&
        reqDate.getMonth() === today.getMonth() &&
        reqDate.getDate() === today.getDate()
      );
    });
  }
}
