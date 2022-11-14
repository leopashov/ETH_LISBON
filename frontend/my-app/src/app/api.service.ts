import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getTotalTokenSupply(): Observable<any> {
    return this.http.get('http://localhost:3000/total-supply');
  }

  getWbtcUsdPrice(): Observable<any> {
    return this.http.get('http://localhost:3000/wbtc-usd-price');
  }

  getEthUsdPrice(): Observable<any> {
    return this.http.get('http://localhost:3000/eth-usd-price');
  }

  getEthBalance(address: string): Observable<any> {
    return this.http.get('http://localhost:3000/eth-balance/:address');
  }

  getDipBalance(address: string): Observable<any> {
    //return this.http.get(`http://localhost:3000/dip-balance?address=${address}`);
    return this.http.get(`http://localhost:3000/dip-balance/${address}`);
  }

  getAllowance(from: string, to: string): Observable<any> {
    return this.http.get('http://localhost:3000/allowance');
  }

  getIndexValue(): Observable<any> {
    return this.http.get('http://localhost:3000/index-value');
  }
}

