import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { firebaseProviders } from './firebase.config'; // Import firebaseProviders

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AppRoutingModule,
  ],
  providers: [
    ...firebaseProviders,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
