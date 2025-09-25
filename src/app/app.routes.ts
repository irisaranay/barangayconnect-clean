import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'registration',
    loadComponent: () => import('./pages/registration/registration/registration.page').then( m => m.RegistrationPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: 'verify-code',
    loadComponent: () => import('./pages/verify-code/verify-code.page').then( m => m.VerifyCodePage)
  },
  {
    path: 'resident-dashboard',
    loadComponent: () => import('./pages/resident-dashboard/resident-dashboard.page').then( m => m.ResidentDashboardPage)
  },
  {
    path: 'secretary-dashboard',
    loadComponent: () => import('./pages/secretary-dashboard/secretary-dashboard.page').then( m => m.SecretaryDashboardPage)
  },
  {
    path: 'captain-dashboard',
    loadComponent: () => import('./pages/captain-dashboard/captain-dashboard.page').then( m => m.CaptainDashboardPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'request-document',
    loadComponent: () => import('./pages/request-document/request-document.page').then( m => m.RequestDocumentPage)
  },
  {
    path: 'request-log',
    loadComponent: () => import('./pages/request-log/request-log.page').then( m => m.RequestLogPage)
  },
  {
    path: 'released-documents',
    loadComponent: () => import('./pages/released-documents/released-documents.page').then( m => m.ReleasedDocumentsPage)
  },  {
    path: 'user-request',
    loadComponent: () => import('./user-request/user-request.page').then( m => m.UserRequestPage)
  },
  {
    path: 'view-details',
    loadComponent: () => import('./view-details/view-details.page').then( m => m.ViewDetailsPage)
  },

];
