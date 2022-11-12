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

  getEthBalance(address: string): Observable<any> {
    return this.http.get('http://localhost:3000/eth-balance/:address');
  }
}
