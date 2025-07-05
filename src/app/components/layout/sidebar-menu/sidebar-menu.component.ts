import { Component, ViewChild, Output, EventEmitter } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Drawer } from 'primeng/drawer';

@Component({
  selector: 'app-sidebar-menu',
 imports: [DrawerModule, ButtonModule, AvatarModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.scss'
})
export class SidebarMenuComponent {


   @ViewChild('drawerRef') drawerRef!: Drawer;

    closeCallback(e: any): void {
        this.drawerRef.close(e);
    }

    @Output() visibleChange = new EventEmitter<boolean>();

    private _visible: boolean = false;
    get visible(): boolean {
        return this._visible;
    }
    set visible(val: boolean) {
        this._visible = val;
        this.visibleChange.emit(this._visible);
    }

}
