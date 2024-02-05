import { CommonModule, DOCUMENT, NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppFrameComponent } from './app-frame/app-frame.component';
import { Observable, fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppFrameComponent, CommonModule, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'draggable-resizable-poc';
  readonly $mouseMoveStream: Observable<MouseEvent>;
  readonly elemIds = Array.from({length: 3}).map((_, index) => ({
    position: {x: 200, y: (index + 1) * 200},
    size: {width: 200, height: 200},
    minSize: {width: 200, height: 200}
  }));

  constructor(@Inject(DOCUMENT) private readonly _document: Document) {
    this.$mouseMoveStream = fromEvent<MouseEvent>(this._document, 'mousemove');
  }

  handleSizeChangeEvent({width, height}: {width: number; height: number;}, index: number) {
    console.log(`component n° ${index} juste resized to [width]: ${width}, [height]: ${height}`);
  }

  handlePositionChangeEvent({x, y}: {x: number; y: number;}, index: number) {
    console.log(`component n° ${index} juste moved to [x]: ${x}, [y]: ${y}`);
  }
}
