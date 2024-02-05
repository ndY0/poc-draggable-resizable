import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, Subject, Subscription, filter, map, mergeAll, windowToggle, withLatestFrom } from 'rxjs';
import { AppFrameEventType } from './app-frame-event-type.enum';

@Component({
  selector: 'app-frame',
  standalone: true,
  imports: [],
  templateUrl: './app-frame.component.html',
  styleUrl: './app-frame.component.sass'
})
export class AppFrameComponent implements OnDestroy, OnInit {
  @Input({required: true}) $mouseMoveStream!: Observable<MouseEvent>;
  @Input({required: true}) inputPosition!: { x: number, y: number };
  @Input({required: true}) inputSize!: { width: number, height: number };
  @Input({required: true}) minSize!: { width: number, height: number };
  @Output() readonly positionChangeEvent: EventEmitter<{x: number, y: number}> = new EventEmitter();
  @Output() readonly sizeChangeEvent: EventEmitter<{width: number, height: number}> = new EventEmitter();
  private readonly $$mousedown = new Subject<{x: number, y: number, eventType: AppFrameEventType}>();
  private readonly $$mouseup = new Subject<undefined>();
  private $positionsStream!: Observable<{x: number, y: number, eventType: AppFrameEventType}>;
  private positionSubscriber: Subscription | undefined;
  private resizeSubscriber: Subscription | undefined;
  position!: { x: number, y: number };
  size!: { width: number, height: number };
  private lastPosition!: { x: number, y: number };
  private lastSize!: { width: number, height: number };
  tooltipValue: string = "";
  displayTooltip = false;

  ngOnInit(): void {
    /**
     * initializing size and position from parameters
     */
    this.position = {...this.inputPosition};
    this.lastPosition = {...this.position};
    this.size = {...this.inputSize};
    this.lastSize = {...this.size};
    /**
     * initialization of shared stream for position 
     */
    this.$positionsStream = this.$mouseMoveStream.pipe(
      /**
       * window toggle allow to take event between the emission of an "opening" observable,
       * and a "closing" one.
       * it returns a higher order observable (observable of observables), that we merge immediately
       * to access the position events. 
       */
      windowToggle(this.$$mousedown, () => this.$$mouseup),
      mergeAll(),
      withLatestFrom(this.$$mousedown),
      map(([$event, {x, y, eventType}]) => {
        console.log(this.displayTooltip)
        return {x: $event.clientX - x, y: $event.clientY - y, eventType}
      })
    );
    /**
     * whe bind the position listener after initialisation
     */
    const partialSubscriberNextDrag = ({x, y}: {x: number, y: number}) => {
      const newXcoordinate = this.lastPosition.x + x;
      const newYcoordinate = this.lastPosition.y + y;
        this.position.x =  newXcoordinate;
        this.position.y =  + newYcoordinate;
        this.tooltipValue = `(x: ${newXcoordinate}}, y: ${newYcoordinate})`;
      }
    this.positionSubscriber = this.$positionsStream
    .pipe(filter(({eventType}) => eventType === AppFrameEventType.DRAG))
    .subscribe({
      next: partialSubscriberNextDrag
    });
    /**
     * whe bind the resize listener after initialisation
     */
    const partialSubscriberNextResize = ({x}: {x: number, y: number}) => {
      const nextSize = this.lastSize.width + x;
      if(nextSize >= this.minSize.width) {
        this.size.width = nextSize;
        this.tooltipValue = `width: ${nextSize}`;
      }
    }
    this.resizeSubscriber = this.$positionsStream
    .pipe(filter(({eventType}) => eventType === AppFrameEventType.RESIZE))
    .subscribe({
      next: partialSubscriberNextResize
    });
  }
  
  ngOnDestroy(): void {
    /**
     * rxjs cleanup
     */
    this.$$mouseup.complete();
    this.$$mousedown.complete();
    this.positionSubscriber?.unsubscribe();
    this.resizeSubscriber?.unsubscribe();
  }
  
  /**
   * bind to mouseup and mousedown events in order to feed both Subjects
   */
  onMouseDownDrag($event: MouseEvent) {
    $event.stopImmediatePropagation();
    this.$$mousedown.next({x: $event.clientX, y: $event.clientY, eventType: AppFrameEventType.DRAG});
    this.displayTooltip = true;
  }
  onMouseUpDrag($event: MouseEvent) {
    $event.stopImmediatePropagation();
    this.$$mouseup.next(undefined);
    this.displayTooltip = false;
    /**
     * refreshing position for next iteration reference
     */
    this.lastPosition = {...this.position};
    this.positionChangeEvent.emit({...this.position});
  }

  /**
   * bind to mouseup and mousedown events in order to feed both Subjects
   */
  onMouseDownResize($event: MouseEvent) {
    $event.stopImmediatePropagation();
    this.$$mousedown.next({x: $event.clientX, y: $event.clientY, eventType: AppFrameEventType.RESIZE});
    this.displayTooltip = true;
  }
  onMouseUpResize($event: MouseEvent) {
    $event.stopImmediatePropagation();
    this.$$mouseup.next(undefined);
    this.displayTooltip = false;
    /**
     * refreshing size for next iteration reference
     */
    this.lastSize = {...this.size};
    this.sizeChangeEvent.emit({...this.size});
  }
}
