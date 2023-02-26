import 'zone.js/dist/zone';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { PostsComponent } from './posts/posts.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule, HttpClientModule, PostsComponent],
  template: `
   <posts></posts>
  `,
})
export class App {
  name = 'Angular';
}

bootstrapApplication(App);
