/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DailyViewComponent } from './daily-view.component';

describe('DailyViewComponent', () => {
  let component: DailyViewComponent;
  let fixture: ComponentFixture<DailyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DailyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
