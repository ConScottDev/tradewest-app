import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailDailogComponent } from './email-dailog.component';

describe('EmailDailogComponent', () => {
  let component: EmailDailogComponent;
  let fixture: ComponentFixture<EmailDailogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailDailogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailDailogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
