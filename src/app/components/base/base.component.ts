import { Component, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';
import { SidebarMenuComponent } from '../layout/sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-base',
  imports: [RouterOutlet, HeaderComponent, SidebarMenuComponent],
  templateUrl: './base.component.html',
  styleUrl: './base.component.scss'
})
export class BaseComponent {
  isMenuVisible =  false

  setMenuVisiable(isvisible: boolean){
    this.isMenuVisible = isvisible
    console.log(this.isMenuVisible)
  }

}
