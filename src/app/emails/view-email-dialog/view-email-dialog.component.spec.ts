import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewEmailDialogComponent } from './view-email-dialog.component';

describe('ViewEmailDialogComponent', () => {
  let component: ViewEmailDialogComponent;
  let fixture: ComponentFixture<ViewEmailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewEmailDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewEmailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
