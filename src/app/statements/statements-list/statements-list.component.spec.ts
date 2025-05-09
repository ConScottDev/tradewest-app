import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementsListComponent } from './statements-list.component';

describe('StatementsListComponent', () => {
  let component: StatementsListComponent;
  let fixture: ComponentFixture<StatementsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatementsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatementsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
