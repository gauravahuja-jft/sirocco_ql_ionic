import { ComposePage } from './../compose-page/compose-page';
import { PostDetailPage } from './../post-detail/post-detail';
import { Post } from './../../models/post';
import { DataProvider } from './../../providers/data-provider';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  posts: any;
  private showSpinner: boolean;

  constructor(public navCtrl: NavController, private dataProvider: DataProvider) {

  }

  ionViewWillEnter() {
    this.showSpinner = true;
    this.dataProvider.getPosts().then(result => {
      this.posts = result.post;
      console.log(this.posts.post);
      this.showSpinner = false;
    });
  }  

  showComposePostPage() {
    this.navCtrl.push(ComposePage);  
  }
  
}
