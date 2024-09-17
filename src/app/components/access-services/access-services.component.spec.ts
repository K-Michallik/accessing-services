import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AccessServicesComponent} from "./access-services.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('AccessServicesComponent', () => {
  let fixture: ComponentFixture<AccessServicesComponent>;
  let component: AccessServicesComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccessServicesComponent],
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader, useValue: {
            getTranslation(): Observable<Record<string, string>> {
              return of({});
            }
          }
        }
      })],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessServicesComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
