import { TestBed } from '@angular/core/testing';

import { GetContractAddressesService } from './get-contract-addresses.service';

describe('GetContractAddressesService', () => {
  let service: GetContractAddressesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetContractAddressesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
