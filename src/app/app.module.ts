import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './components/components.module';
import { AppComponent } from './app.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment, firebaseConfig } from '../environments/environment';

@NgModule({ declarations: [
        AppComponent,
        AdminLayoutComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        ComponentsModule,
        RouterModule,
        AppRoutingModule,
        AngularFireModule.initializeApp(firebaseConfig),
        AngularFirestoreModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
