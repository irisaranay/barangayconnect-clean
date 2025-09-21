import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrationService } from 'src/app/services/registration.service';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class RegistrationPage implements OnInit {
  [key: string]: any;

  // User Info
  firstName = '';
  middleName = '';
  lastName = '';
  dob = '';
  gender = '';
  civilStatus = '';
  contact = '';
  purok = '';
  barangay = '';
  city = '';
  province = '';
  postalCode = '';

  // Security
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;
  passwordError = false;
  confirmError = false;
  passwordFocused = false;
  confirmFocused = false;

  // Photo
  photo: string | null = null;

  // Age Validation
  maxDate = '';
  isUnderage = false;
  calculatedAge = 0;
  dobSelected = false;

  // Validation
  nameErrors: { [key: string]: string } = {};

  purokOptions: string[] = [
    'Purok Mangga', 'Purok Tambis', 'Purok Lubi', 'Purok Tinago',
    'Purok Tabok', 'Purok Tagaytay', 'Purok Sapa', 'Purok Centro'
  ];

  constructor(
    private registrationService: RegistrationService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.setMaxDOB();
  }

  setMaxDOB() {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    this.maxDate = today.toISOString().split('T')[0];
  }

  checkAge(value: string | string[] | null | undefined) {
    const dateStr = Array.isArray(value) ? value[0] : value;
    if (!dateStr) return;

    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    this.calculatedAge = age;
    this.isUnderage = age < 18;
    this.dobSelected = true;

    if (this.isUnderage) {
      this.presentToast('🚫 You must be at least 18 years old.', 'warning');
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmVisibility() {
    this.showConfirm = !this.showConfirm;
  }

  validatePassword() {
    const hasUpper = /[A-Z]/.test(this.password);
    const hasLower = /[a-z]/.test(this.password);
    const hasSpecial = /[\W_]/.test(this.password);
    const isLongEnough = this.password.length >= 8;
    this.passwordError = !(hasUpper && hasLower && hasSpecial && isLongEnough);
  }

  autoUppercaseLive(event: any, fieldName: string) {
    const input = event.target;
    const start = input.selectionStart;
    const rawValue = input.value.replace(/[^a-zA-ZñÑ\s'-]/g, '');
    const uppercased = rawValue.toUpperCase();
    this[fieldName] = uppercased;

    setTimeout(() => {
      input.setSelectionRange(start, start);
    });
  }

  validateName(field: string) {
    const value = (this as any)[field];
    const trimmed = value.trim();

    if (!trimmed || /^[\s'-]+$/.test(trimmed)) {
      this.nameErrors[field] = 'Name must not be empty or contain only special characters.';
    } else if (!/^[A-Za-zÑñ\s'-]+$/.test(trimmed)) {
      this.nameErrors[field] = 'Only letters, spaces, hyphens, and apostrophes are allowed.';
    } else {
      this.nameErrors[field] = '';
    }
  }

  preventPaste(event: Event) {
    event.preventDefault();
  }

  async register() {
    this.validatePassword();
    this.confirmError = this.password !== this.confirmPassword;

    const missingFields: string[] = [];
    if (!this.firstName) missingFields.push('First Name');
    if (!this.lastName) missingFields.push('Last Name');
    if (!this.contact) missingFields.push('Contact Number');
    if (!this.gender) missingFields.push('Gender');
    if (!this.dob) missingFields.push('Date of Birth');
    if (!this.password) missingFields.push('Password');
    if (!this.confirmPassword) missingFields.push('Confirm Password');
    if (!this.purok) missingFields.push('Purok');

    if (missingFields.length > 0) {
      const message = `⚠️ Missing: ${missingFields.join(', ')}`;
      await this.presentToast(message, 'warning');
      return;
    }

    if (this.isUnderage) {
      await this.presentToast('🚫 You must be at least 18 years old to register.', 'danger');
      return;
    }

    if (this.passwordError || this.confirmError) {
      await this.presentToast('❌ Please fix password errors.', 'danger');
      return;
    }

    const isValidName = (name: string) => {
      const trimmed = name.trim();
      return trimmed && /^[A-Za-zÑñ\s'-]+$/.test(trimmed);
    };

    if (![this.firstName, this.lastName].every(isValidName)) {
      await this.presentToast('❌ Names must only contain letters, spaces, hyphens, or apostrophes.', 'danger');
      return;
    }

   if (!/^[9]\d{9}$/.test(this.contact)) {
  await this.presentToast('⚠️ Enter a valid 10-digit mobile number (starts with 9)', 'warning');
  return;
}

function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return '+63' + cleaned.slice(1);
  }
  return cleaned.startsWith('9') && cleaned.length === 10 ? '+63' + cleaned : cleaned;
}

const formattedContact = normalizePhone(this.contact); 

const isDupContact = await this.registrationService.isDuplicateContact(formattedContact);
const isDupName = await this.registrationService.isDuplicateName(this.firstName, this.middleName, this.lastName);

if (isDupContact || isDupName) {
  await this.presentToast('⚠️ Duplicate record found.', 'danger');
  return;
}

const newRecord = {
  firstName: this.firstName.trim(),
  middleName: this.middleName.trim(),
  lastName: this.lastName.trim(),
  dob: this.dob,
  gender: this.gender,
  civilStatus: this.civilStatus,
  contact: formattedContact,
  purok: this.purok,
  barangay: this.barangay,
  city: this.city,
  province: this.province,
  postalCode: this.postalCode,
  password: this.password,
  photo: this.photo,
  role: 'resident',
};

    await this.registrationService.saveOfflineRegistration(newRecord);
    await this.presentToast('✅ Registered successfully!', 'success');
    console.log('📥 Saving to SQLite:', newRecord);
    this.clearForm();
    this.router.navigate(['/login']);
  }

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      this.photo = image.dataUrl || null;
    } catch (error) {
      await this.presentToast('❌ Failed to take photo.', 'danger');
      console.error(error);
    }
  }

  clearForm() {
    this.firstName = '';
    this.middleName = '';
    this.lastName = '';
    this.dob = '';
    this.gender = '';
    this.civilStatus = '';
    this.contact = '';
    this.purok = '';
    this.barangay = '';
    this.city = '';
    this.province = '';
    this.postalCode = '';
    this.password = '';
    this.confirmPassword = '';
    this.photo = null;
    this.passwordError = false;
    this.confirmError = false;
    this.showPassword = false;
    this.showConfirm = false;
    this.isUnderage = false;
    this.calculatedAge = 0;
    this.dobSelected = false;
    this.nameErrors = {};
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }

  async testView() {
    const all = await this.registrationService.getAllRegistrations();
    console.log('📄 All registrations:', all);
  }
}
