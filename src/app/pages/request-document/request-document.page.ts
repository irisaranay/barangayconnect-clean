import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController, ActionSheetController, Platform } from '@ionic/angular';
import { DocumentRequestService } from 'src/app/services/document-request.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { RegistrationService } from 'src/app/services/registration.service';

@Component({
  selector: 'app-request-document',
  templateUrl: './request-document.page.html',
  styleUrls: ['./request-document.page.scss'],  
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
})
export class RequestDocumentPage implements OnInit {
  documentType = '';
  purpose = '';
  customPurpose = '';
  numberOfCopies: number = 1;
  requirements = '';
  photo: string = '';
  uploadedPhoto: string | null = null;
  requests: any[] = [];
  dateNow: string = '';
  timeNow: string = '';

  documentOptions = [
    'Barangay Clearance',
    'Certificate of Residency',
    'Certificate of Indigency',
  ];

  purposeOptions = [
    'Employment',
    'School Requirement',
    'Financial Assistance',
    'Others',
  ];

  constructor(
    private navCtrl: NavController,
    private requestService: DocumentRequestService,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private platform: Platform,
    private registrationService: RegistrationService
  ) {}

  async ngOnInit() {
    const now = new Date();
    this.dateNow = now.toLocaleDateString();
    this.timeNow = now.toLocaleTimeString();

    const currentUser = this.registrationService.getCurrentUser();

    if (currentUser && currentUser.contact) {
      this.requests = await this.requestService.getRequestsByContact(currentUser.contact);
      console.log('📄 My Requests:', this.requests);
    } else {
      console.warn('⚠️ No logged-in user found.');
    }

    // Start background sync, but UI is not blocked
    this.syncRequestsInBackground();
  }

  // ================= Background Sync Function =================
  private async syncRequestsInBackground() {
    // run without blocking UI
    setTimeout(() => {
      this.requestService.syncUnsyncedRequests();
    }, 500);
  }

  onCancel() {
    this.navCtrl.back();
  }

  async onContinue() {
    if (this.purpose === 'Others' && !this.customPurpose.trim()) {
      alert('Please specify your purpose.');
      return;
    }

    if (this.numberOfCopies < 1) {
      alert('Number of copies must be at least 1.');
      return;
    }

    const finalPurpose = this.purpose === 'Others' ? this.customPurpose : this.purpose;

    const currentUser = this.registrationService.getCurrentUser();

    if (!currentUser || !currentUser.contact) {
      alert('No logged-in user found.');
      return;
    }

    const requestData = {
      documentType: this.documentType,
      purpose: finalPurpose,
      copies: this.numberOfCopies,
      requirements: this.requirements,
      photo: this.photo,
      timestamp: new Date().toISOString(),
      contact: currentUser.contact,
      status: 'Pending',
      notes: '',
      isSynced: 0
    };

    try {
      // ✅ Insert into SQLite first
      await this.requestService.addRequest(requestData);

      // ✅ Immediately sync to PostgreSQL in background (UI not blocked)
      this.requestService.syncUnsyncedRequests();

      const successAlert = await this.alertCtrl.create({
        header: 'Success',
        message: 'Your request has been submitted.',
        buttons: ['OK'],
      });
      await successAlert.present();

      this.resetForm();
    } catch (err) {
      console.error('Request submission failed:', err);
      alert('Failed to submit request. Please try again.');
    }
  }

  async openPhotoOptions() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });

      this.uploadedPhoto = image.dataUrl || null;
      this.photo = image.dataUrl || '';
    } catch (error) {
      console.error('Failed to get photo', error);
    }
  }

  resetForm() {
    this.documentType = '';
    this.purpose = '';
    this.customPurpose = '';
    this.numberOfCopies = 1;
    this.requirements = '';
    this.photo = '';
    this.uploadedPhoto = null;
  }
}
