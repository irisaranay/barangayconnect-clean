import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-details',
  templateUrl: './view-details.page.html',
  styleUrls: ['./view-details.page.scss'],
  standalone: true,
  imports: [IonicModule,
    CommonModule
],
schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ViewDetailsPage {

  @Input() request: any; // request data
  @Input() modalType: 'closeOnly' | 'deleteCancel' | 'print' = 'closeOnly';

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {}

  // Close modal
  closeModal() {
    this.modalCtrl.dismiss();
  }

  // Delete request with confirmation
  async deleteRequest() {
    const alert = await this.alertCtrl.create({
      header: 'Are you sure?',
      message: 'Do you want to move this request to the recycle bin?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Move to Recycle Bin',
          handler: () => {
            console.log('Request moved to recycle bin:', this.request);
            this.closeModal();
          }
        }
      ]
    });
    await alert.present();
  }

  // Print request → open browser print dialog
  printRequest() {
    const printContents = document.querySelector('.details-card')?.innerHTML;
    if (printContents) {
      const popupWin = window.open('', '_blank', 'width=800,height=600');
      if (popupWin) {
        popupWin.document.open();
        popupWin.document.write(`
          <html>
            <head>
              <title>Print Request</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .details-card { width: 100%; }
              </style>
            </head>
            <body>${printContents}</body>
          </html>
        `);
        popupWin.document.close();
        popupWin.focus();
        popupWin.print();
        popupWin.close();
      }
    }
  }

  // Status color
  getStatusColor(status: string) {
    switch (status) {
      case 'Completed': return '#27ae60';
      case 'Pending': return '#9b59b6';
      case 'Pending-Incomplete': return '#e67e22';
      case 'For Pickup': return '#2980b9';
      case 'Expired': return '#c0392b';
      case 'Approved': return '#f1c40f';
      default: return '#333';
    }
  }
}
