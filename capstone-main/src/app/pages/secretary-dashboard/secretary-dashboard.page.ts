import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { IndexedDBService } from 'src/app/services/indexed-db.service'; // make sure correct path


Chart.register(...registerables);

@Component({
  selector: 'app-secretary-dashboard',
  templateUrl: './secretary-dashboard.page.html',
  styleUrls: ['./secretary-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SecretaryDashboardPage implements OnInit, OnDestroy {

  requestCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  chart!: Chart;
  totalRequests: number = 0;
  pendingRequests: number = 0;
  completedRequests: number = 0;

  selectedFilter: string = 'thisMonth'; // 🔹 Filter state
  requestData: any[] = [];
  filteredData: any[] = []; // 🔹 Holds filtered data

  currentDate: Date = new Date(); 

  constructor(
    private router: Router,
    private alertController: AlertController,
    private indexedDbService: IndexedDBService
  ) {}

  ngOnInit() {
    this.loadDashboardCounts();


    // Sample request data with timestamps
    this.requestData = [
      { name: 'Certificate of Indigency', status: 'Pending', timestamp: '2025-08-01T12:00:00Z' },
      { name: 'Barangay Clearance', status: 'Approved', timestamp: '2025-07-10T12:00:00Z' },
      { name: 'Cedula', status: 'Rejected', timestamp: '2025-06-20T12:00:00Z' }
    ];

    this.filterData(this.selectedFilter); // 🔹 Initial filter
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

 async loadDashboardCounts() {
  const allRequests = await this.indexedDbService.getAllRequests();
  const pending = await this.indexedDbService.getRequestsByStatus('Pending');
  const completed = await this.indexedDbService.getRequestsByStatus('Completed');
  const today = await this.indexedDbService.getRequestsToday();

  this.requestCount = allRequests.length;
  this.approvedCount = completed.length;
  this.rejectedCount = allRequests.filter(r => r.status === 'Rejected').length;

  this.totalRequests = allRequests.length;
  this.pendingRequests = pending.length;
  this.completedRequests = completed.length;

  this.requestData = allRequests;
  this.filterData(this.selectedFilter);

  this.renderChart();
}


  renderChart() {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
          label: 'Requests Summary',
          data: [
            this.requestCount,
            this.approvedCount,
            this.rejectedCount
          ],
          backgroundColor: ['#FFA500', '#4CAF50', '#F44336']
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      case 'Completed': return 'medium';
      case 'For Pickup': return 'primary';
      default: return 'light';
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: () => {
            localStorage.clear();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  // 🔹 Filter Function
  filterData(filter: string) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (filter) {
      case 'thisWeek':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'lastWeek':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() - 7);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - now.getDay() - 1);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'all':
      default:
        this.filteredData = this.requestData;
        return;
    }

    this.filteredData = this.requestData.filter(req => {
      const reqDate = new Date(req.timestamp);
      return reqDate >= startDate && reqDate <= endDate;
    });
  }

}
