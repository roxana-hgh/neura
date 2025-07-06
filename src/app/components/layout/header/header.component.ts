import { Component, inject } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { PopoverModule } from 'primeng/popover';
import { ThemeService } from '../../../services/theme.service';


@Component({
  selector: 'app-header',
  imports: [AvatarModule, PopoverModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

 private themeService = inject(ThemeService)
   darkMode: boolean = false;

   toggleDarkMode() {
     let selctedTheme = this.darkMode ? 'light' : 'dark';
     this.darkMode = !this.darkMode
    this.themeService.setTheme(selctedTheme);
  }

}
