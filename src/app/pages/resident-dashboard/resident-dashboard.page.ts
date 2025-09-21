import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonMenu,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { RegistrationService } from 'src/app/services/registration.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-resident-dashboard',
  templateUrl: './resident-dashboard.page.html',
  styleUrls: ['./resident-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonMenu,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar
    ],
})
export class ResidentDashboardPage implements OnInit {
  currentDate = '';
  currentDay = '';
  currentTime = '';
  user: any = null;

  documents = [
    {
      name: 'Barangay Clearance',
      leadTime: '1 Day',
      requirements: 'Valid ID',
      fee: '₱50',
    },
    {
      name: 'Barangay Indigency',
      leadTime: '1 Day',
      requirements: 'None',
      fee: '₱30',
    },
    {
      name: 'Business Permit',
      leadTime: '2 Days',
      requirements: 'Application Form',
      fee: '₱100',
    },
  ];

  constructor(
    private router: Router,
    private registrationService: RegistrationService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    await this.loadUser();
  }

  updateDateTime() {
    const now = new Date();
    const locale = navigator.language || 'en-US';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    this.currentDate = now.toLocaleDateString(locale, options);
    this.currentDay = now.toLocaleDateString(locale, { weekday: 'long' });
    this.currentTime = now.toLocaleTimeString(locale);
  }

  async loadUser() {
    try {
      this.user = await this.registrationService.getCurrentUser();
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  editProfile() {
    this.router.navigate(['/profile']);
  }

  goToRequestDocument() {
    this.router.navigate(['/request-document']);
  }

  goToRequestLog() {
  this.router.navigate(['/request-log']);
}
  goToReleasedDocuments() {
  this.router.navigate(['/released-documents']);
}



  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }
}
