import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private Theme = new BehaviorSubject<string>('light');

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('light');
    }
  }

  setTheme(theme: string) {
    localStorage.setItem('theme', theme);
    this.Theme.next(theme);
    if (theme == 'light') {
      document.documentElement.classList.remove('dark');
    } else if (theme == 'dark') {
      document.documentElement.classList.add('dark');
    }
  }

  getTheme(): Observable<string> {
    return this.Theme.asObservable();
  }
}
