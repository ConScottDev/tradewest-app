import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementDialogComponent } from './statement-dialog.component';

describe('StatementDialogComponent', () => {
  let component: StatementDialogComponent;
  let fixture: ComponentFixture<StatementDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatementDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatementDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
