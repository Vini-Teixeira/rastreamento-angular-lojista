import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryDetailsModalComponent } from './delivery-details-modal.component';

describe('DeliveryDetailsModalComponent', () => {
  let component: DeliveryDetailsModalComponent;
  let fixture: ComponentFixture<DeliveryDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryDetailsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
