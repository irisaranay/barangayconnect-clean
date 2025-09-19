import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButtons
} from '@ionic/angular/standalone';
import { DocumentRequestService } from 'src/app/services/document-request.service'; // Add your service import
import { RegistrationService } from 'src/app/services/registration.service';

@Component({
  selector: 'app-request-log',
  templateUrl: './request-log.page.html',
  styleUrls: ['./request-log.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonButton,
      IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButtons
  ]
})
export class RequestLogPage implements OnInit {
  itemsPerPage = 5;
  currentPage = 1;
  totalPages = 1;
  searchTerm = '';

  requests: any[] = [];
  paginatedRequests: any[] = [];

  selectedRequest: any = null;
  showModal = false;

  constructor(private documentRequestService: DocumentRequestService,  private registrationService: RegistrationService) {}

  ngOnInit() {
    this.loadRequests();
  }

  async ionViewWillEnter() {
    await this.loadRequests();
  }

  async loadRequests() {
     const currentUser = this.registrationService.getCurrentUser(); 
    if (!currentUser || !currentUser.contact) {
      this.requests = [];
      return;
    }

   this.requests = await this.documentRequestService.getRequestsByContact(currentUser.contact);
    this.filterRequests();
  }

  filterRequests() {
    const filtered = this.requests.filter(r =>
      r.documentType.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      r.purpose.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
    this.paginateRequests(filtered);
  }

  paginateRequests(filteredList = this.requests) {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedRequests = filteredList.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateRequests();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateRequests();
    }
  }

  viewDetails(request: any) {
    this.selectedRequest = request;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async cancelRequest(request: any) {
  await this.documentRequestService.cancelRequestById(request.id);
  this.loadRequests(); // reload
}

async deleteRequest(request: any) {
  await this.documentRequestService.deleteRequestById(request.id);
  this.loadRequests(); // reload
}


  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return 'danger';
      case 'Pending-Incomplete': return 'success';
      case 'For Pickup': return 'dark';
      case 'Cancelled': return 'warning';
      default: return 'medium';
    }
  }
}
