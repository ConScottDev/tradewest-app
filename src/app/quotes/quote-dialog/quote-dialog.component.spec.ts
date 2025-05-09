import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoteDialogComponent } from './quote-dialog.component';

describe('QuoteDialogComponent', () => {
  let component: QuoteDialogComponent;
  let fixture: ComponentFixture<QuoteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuoteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
