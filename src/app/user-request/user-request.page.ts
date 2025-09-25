import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule, ModalController, AlertController, NavController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ViewDetailsPage } from '../view-details/view-details.page';


@Component({
  selector: 'app-user-request',
  templateUrl: './user-request.page.html',
  styleUrls: ['./user-request.page.scss'],
  standalone: true,
  imports: [IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
],
schemas: [CUSTOM_ELEMENTS_SCHEMA] // add this
})
export class UserRequestPage implements OnInit {
  today: Date = new Date();
  filterStatus: string = 'all';
  filterType: string = 'all';
  filterDateFrom: string = '';
  filterDateTo: string = '';
  filterSearch: string = '';

  rowsPerPage: number = 10;
  rowsOptions: number[] = [10, 25, 50, 100];
  currentPage: number = 0;

  requests = [
    { date: new Date('2025-08-30T20:51:15'), resident: 'Rosell, Jehan', document: 'Indigency', status: 'Pending', match: 'YES', rejectReason: '' },
    { date: new Date('2025-08-29T10:30:00'), resident: 'Juan, Dela', document: 'Residency', status: 'Approved', match: 'YES', rejectReason: '' },
    { date: new Date('2025-08-28T15:45:00'), resident: 'Anna, Cruz', document: 'Residency', status: 'Completed', match: 'NO', rejectReason: 'No valid ID uploaded' },
    { date: new Date('2025-08-27T09:15:00'), resident: 'Mark, Reyes', document: 'Indigency', status: 'Pending', match: 'YES', rejectReason: '' },
  ];

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    setInterval(() => { this.today = new Date(); }, 1000);
  }

  // ---------------- FILTER & PAGINATION ----------------
  get filteredRequests() {
    return this.requests.filter(req => {
      const statusMatch = this.filterStatus === 'all' || req.status.toLowerCase() === this.filterStatus.toLowerCase();
      const typeMatch = this.filterType === 'all' || req.document.toLowerCase() === this.filterType.toLowerCase();
      let dateMatch = true;
      if (this.filterDateFrom) dateMatch = dateMatch && new Date(req.date) >= new Date(this.filterDateFrom);
      if (this.filterDateTo) dateMatch = dateMatch && new Date(req.date) <= new Date(this.filterDateTo);
      const searchMatch = !this.filterSearch || req.resident.toLowerCase().includes(this.filterSearch.toLowerCase());
      return statusMatch && typeMatch && dateMatch && searchMatch;
    });
  }

  get startItem() { return this.currentPage * this.rowsPerPage; }
  get endItem() { return Math.min((this.currentPage + 1) * this.filteredRequests.length, this.filteredRequests.length); }
  get pagedRequests() { return this.filteredRequests.slice(this.startItem, this.endItem); }
  updatePagination() { this.currentPage = 0; }
  prevPage() { if (this.currentPage > 0) this.currentPage--; }
  nextPage() { if (this.endItem < this.filteredRequests.length) this.currentPage++; }

  // ---------------- MODAL ----------------
  async openDetails(request: any, modalType: string) {
    const modal = await this.modalCtrl.create({
      component: ViewDetailsPage,
      componentProps: { request, modalType },
      cssClass: 'floating-modal',
      backdropDismiss: false
    });
    await modal.present();
  }

  // ---------------- APPROVE / REJECT WITH LOADING ----------------
  private async showLoading(actionFn: Function) {
    const loading = await this.loadingCtrl.create({
      message: 'Processing...',
      spinner: 'crescent',
      duration: 1000 // 1 second loading
    });
    await loading.present();

    setTimeout(async () => {
      await actionFn();
      await loading.dismiss();
    }, 100); // tiny delay for smooth display
  }

  approve(request: any) {
    this.showLoading(async () => {
      const alert = await this.alertController.create({
        header: 'Confirm Approval',
        message: `Are you sure you want to approve this resident?`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Approve', handler: () => { request.status = 'Approved'; } }
        ]
      });
      await alert.present();
    });
  }

  reject(request: any) {
    this.showLoading(async () => {
      const alert = await this.alertController.create({
        header: 'Reject Resident',
        message: 'Please select the reason for rejection:',
        inputs: [
          { type: 'checkbox', label: 'No valid ID uploaded', value: 'No valid ID uploaded' },
          { type: 'checkbox', label: 'Blurry or unclear photo', value: 'Blurry or unclear photo' },
          { type: 'checkbox', label: 'Wrong address', value: 'Wrong address' },
          { type: 'checkbox', label: 'Not found/verified Purok', value: 'Not found/verified Purok' },
          { type: 'checkbox', label: 'Other', value: 'Other' }
        ],
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { 
            text: 'Reject', 
            handler: async (data: any) => {
              let reasons = Array.isArray(data) ? data.filter((item: string) => item !== 'Other') : [];
              if (data.includes('Other')) {
                const otherAlert = await this.alertController.create({
                  header: 'Other Reason',
                  inputs: [{ name: 'otherReason', type: 'text', placeholder: 'Type your reason' }],
                  buttons: [
                    { text: 'Cancel', role: 'cancel' },
                    { text: 'OK', handler: (otherData) => {
                        const typedReason = otherData.otherReason?.trim();
                        if (typedReason) {
                          reasons.push(typedReason);
                          request.status = 'Rejected';
                          request.rejectReason = reasons.join(', ');
                        } else { this.showNoReasonAlert(); }
                    }}
                  ]
                });
                await otherAlert.present();
                return false;
              }
              if (reasons.length === 0) { this.showNoReasonAlert(); return false; }
              request.status = 'Rejected';
              request.rejectReason = reasons.join(', ');
              return true;
            } 
          }
        ]
      });
      await alert.present();
    });
  }

  async showRejectedAlert(request: any) {
    const alert = await this.alertController.create({
      header: 'Rejected Resident',
      message: `This resident was rejected for: ${request.rejectReason}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showNoReasonAlert() {
    const alert = await this.alertController.create({
      header: 'No Reason Provided',
      message: 'Please select or type at least one reason for rejection.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // ---------------- PRINT BUTTON ----------------
  printRequest(request: any) {
    this.showLoading(async () => {
      // Implement actual print logic here
      console.log('Printing request for', request.resident);
    });
  }

  // ---------------- NAVIGATION ----------------
  goToPage(url: string) {
    // No loading or fade on page navigation anymore
    this.navCtrl.navigateForward(url, { animated: true });
  }
}
