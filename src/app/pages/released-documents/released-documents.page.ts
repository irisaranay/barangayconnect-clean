import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { DocumentRequestService } from 'src/app/services/document-request.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-released-documents',
  templateUrl: './released-documents.page.html',
  styleUrls: ['./released-documents.page.scss'],
  standalone: true,
  imports: [IonContent, IonicModule, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ReleasedDocumentsPage implements OnInit {
  releasedDocuments: any[] = [];
  paginatedDocuments: any[] = [];
  selectedDocument: any = null;

  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 0;
  itemsPerPage: number = 5;

  showModal: boolean = false;
  searchTerm: string = '';

  constructor(private requestService: DocumentRequestService) {}

  async ngOnInit() {
    await this.loadReleasedDocuments();
  }

  async loadReleasedDocuments() {
    try {
      this.releasedDocuments = await this.requestService.getReleasedDocuments();
      this.filterDocuments();
    } catch (error) {
      console.error('Error fetching released documents:', error);
    }
  }

  paginateDocuments() {
    this.totalPages = Math.ceil(this.releasedDocuments.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedDocuments = this.releasedDocuments.slice(start, end);
  }

  filterDocuments() {
    if (this.searchTerm.trim() === '') {
      this.paginatedDocuments = [...this.releasedDocuments];
    } else {
      const filtered = this.releasedDocuments.filter(doc =>
        doc.documentType.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.paginatedDocuments = filtered;
    }
    this.totalPages = Math.ceil(this.paginatedDocuments.length / this.itemsPerPage);
    this.currentPage = 1;
    this.paginateDocuments();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateDocuments();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateDocuments();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateDocuments();
    }
  }

  async markAsReleased(document: any) {
    try {
      await this.requestService.updateStatus(document.id, 'Released');
      await this.loadReleasedDocuments();
      this.closeModal();
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  }

  openInstructions(document: any) {
    this.selectedDocument = document;
    this.showModal = true;
  }

  closeModal() {
    this.selectedDocument = null;
    this.showModal = false;
  }

  viewDetails(document: any) {
    this.selectedDocument = document;
  }

  clearSelectedDocument() {
    this.selectedDocument = null;
  }
}
