import { Component } from '@angular/core';
import { RegistrationService } from 'src/app/services/registration.service';
import { ToastController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ProfilePage {
  user: any = {};
  isEditing = false;
  isContactModalOpen = false;
   newPassword: string = '';
  confirmPassword: string = '';
  showNewPassword: boolean = false;
showConfirmPassword: boolean = false;


  constructor(
    private registrationService: RegistrationService,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {}

  goBack() {
    this.navCtrl.back(); 
  }

  ionViewWillEnter() {
    this.user = this.registrationService.getCurrentUser();
  }

async toggleEdit() {
  if (this.isEditing) {
    if (this.newPassword || this.confirmPassword) {
      if (this.newPassword !== this.confirmPassword) {
        this.presentToast('⚠️ Passwords do not match.', 'danger');
        return;
      }

      // Hash new password before updating
      this.user.password = CryptoJS.SHA256(this.newPassword).toString();
    }

    await this.registrationService.updateUser(this.user);
    this.presentToast('✅ Changes saved successfully.', 'success');

    // Clear password fields after saving
    this.newPassword = '';
    this.confirmPassword = '';
  }

  this.isEditing = !this.isEditing;
}

toggleNewPasswordVisibility() {
  this.showNewPassword = !this.showNewPassword;
}

toggleConfirmPasswordVisibility() {
  this.showConfirmPassword = !this.showConfirmPassword;
}


  openContactModal() {
    if (this.isEditing) {
      this.isContactModalOpen = true;
    }
  }

  closeModal() {
    this.isContactModalOpen = false;
  }

  updateContactNumber(newNumber: string) {
    this.user.contact = newNumber;
    this.closeModal();
    this.presentToast('📱 Contact number updated!', 'success');
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color: color,
    });
    await toast.present();
  }
}
