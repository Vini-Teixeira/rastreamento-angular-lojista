import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardLojistaComponent } from './dashboard-lojista.component';

describe('DashboardLojistaComponent', () => {
  let component: DashboardLojistaComponent;
  let fixture: ComponentFixture<DashboardLojistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLojistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardLojistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
