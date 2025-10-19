import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarSocorroComponent } from './solicitar-socorro.component';

describe('SolicitarSocorroComponent', () => {
  let component: SolicitarSocorroComponent;
  let fixture: ComponentFixture<SolicitarSocorroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarSocorroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitarSocorroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
