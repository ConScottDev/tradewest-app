import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class InvoiceNoValidatorService {
  constructor(private firestore: AngularFirestore) {}

  invoiceNoExistsValidator(): ValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.firestore.collection('statements', ref => ref.where('invoiceNo', '==', control.value))
        .snapshotChanges()
        .pipe(
          map(statements => {
            return statements.length > 0 ? { invoiceNoExists: true } : null;
          })
        );
    };
  }
}
