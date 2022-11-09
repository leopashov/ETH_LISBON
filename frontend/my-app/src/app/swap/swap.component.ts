import { AfterViewInit, Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})

export class SwapComponent implements OnInit, AfterViewInit {
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  constructor() {
    
  }

  ngOnInit(): void {
    const componentRef = this.vcr.createComponent(HeaderComponent);
    console.log(componentRef.instance.walletAddress);
  }

  ngAfterViewInit(): void {
    
  }

}
