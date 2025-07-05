import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-header',
  imports: [AvatarModule, PopoverModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

}
