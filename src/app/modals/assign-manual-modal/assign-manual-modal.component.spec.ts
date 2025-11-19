import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignManualModalComponent } from './assign-manual-modal.component';

describe('AssignManualModalComponent', () => {
  let component: AssignManualModalComponent;
  let fixture: ComponentFixture<AssignManualModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignManualModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignManualModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
