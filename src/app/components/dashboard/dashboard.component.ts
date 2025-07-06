import { Component } from '@angular/core';
import { AddNewTaskComponent } from '../Tasks/add-new-task/add-new-task.component';
import { TaskItemComponent } from '../Tasks/task-item/task-item.component';

@Component({
  selector: 'app-dashboard',
  imports: [AddNewTaskComponent, TaskItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}
