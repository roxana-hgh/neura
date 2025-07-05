import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BaseComponent } from './components/base/base.component';

export const routes: Routes = [
    {
    path: '',
    component: BaseComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent
      }
    ]
}
];
