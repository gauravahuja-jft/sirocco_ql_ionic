import { GraphQLUtils } from './../utils/GraphQLUtils';
import { Comment } from './../models/comment';
import { User } from './../models/user';
import { Post } from './../models/post';
import { Injectable } from '@angular/core';
import { Http, URLSearchParams, Response, Headers } from '@angular/http';
import { LoadingController, ToastController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import "rxjs/add/operator/toPromise";
import { Camera, CameraOptions } from '@ionic-native/camera';
import { File } from '@ionic-native/file';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import gql from 'graphql-tag';
import { getClient } from './../utils/graphql.client'
import { Apollo } from 'apollo-angular';

/*
  Generated class for the DataProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/

declare var cordova: any;

@Injectable()
export class DataProvider {
  private baseUrl: string = 'http://localhost:3000/graphql';
  uploadedFilename: string;

  constructor(public http: Http,private apollo: Apollo, private camera: Camera, private file: File, private loadingCtrl: LoadingController, private toastCtrl: ToastController) {
    console.log('Hello DataProvider Provider');
  }

  private handleError(error: any): Promise<any> {
    console.error('Error occured :', error);
    return Promise.reject(error.message || error);
  }

  async getPosts(): Promise<Post[]> {
    var posts: Post[];
    await this.apollo.query({
      query: gql`
        query AllPosts {
          post {
              id
              content
              date_created
              user {
                id
                username  
              }
              likes{
                id
              }
          }
        }`
    }).toPromise().then(result => {
      posts = this.extractPosts(result.data);
    }).catch(error => {
      console.log(`Error: ${error.message}`);
      });
    return posts;
  }

  private extractPosts(data: any): Post[] {
    return data as Post[]
  }

  async getComments(postId: string): Promise<Comment[]> {
    var options = new URLSearchParams();
    var comments = new Array<Comment>();
    options.append('max', "10");
    options.append('postId', postId);
    await this.http.get(this.baseUrl + 'post/getComments', { search: options }).toPromise().then(res => {
      comments = this.extractComments(res);
    });
    return comments;
  }

  async getPost(id: string): Promise<Post> {
    var options = new URLSearchParams();
    var post = new Post();
    options.append('id', id);
    await this.http.get(this.baseUrl + 'post', { search: options }).toPromise().then(res => {
      post = res.json()  ;
    });
    return post;
  }

  async postComment(userId: string, postId: string, commentText: string): Promise<boolean> {
    var result = false;
    
    let headers = new Headers();
    //headers.append('Content-Type', 'application/json');

    let body = { userId: userId, postId: postId, commentText: commentText };
    
    await this.http.post(this.baseUrl + 'post/addComment', JSON.stringify(body), { headers: headers }).toPromise().then(res => {
      if (res.status == 200) {
        result = true;
      }
    });
    return result;
  }

  async createPost(userId: string, content: string, imageLink?: string): Promise<boolean> {
    var result = false;
    let headers = new Headers();
    let body: any;
    //headers.append('Content-Type', 'application/json');
    if (this.uploadedFilename) {
      body = { userId: userId, content: content, imageLink: this.uploadedFilename };
    } else {
      body = { userId: userId, content: content };
    }
    try {
      await this.http.post(this.baseUrl + 'post/createPost', JSON.stringify(body), { headers: headers }).toPromise().then(res => {
        if (res.status == 200) {
          result = true;
          this.uploadedFilename = "";
        }
      });
    } catch (e){
      result = false;
    }

    return result;
  }

  async getLikesCount(id: string): Promise<number> {
    var options = new URLSearchParams();
    var likes: number;
    options.append('postId', id);
    await this.http.get(this.baseUrl + 'post/likesCount', { search: options }).toPromise().then(res => {
      likes = res.json().likesCount;
    });
    return likes;
  }

  async getCommentsCount(id: string): Promise<number> {
    var options = new URLSearchParams();
    var comments: number;
    options.append('postId', id);
    await this.http.get(this.baseUrl + 'post/commentsCount', { search: options }).toPromise().then(res => {
      comments = res.json().commentsCount;
    });
    return comments;
  }

  async likePost(userId: string, postId: string): Promise<boolean> {
    var options = new URLSearchParams();
    var result = false;
    options.append('userId', userId);
    options.append('postId', postId);
    await this.http.get(this.baseUrl + 'post/likePost', { search: options }).toPromise().then(res => {
      result = true;
    });
    return result;
  }

  async getUser(userId: string): Promise<User> {
    var options = new URLSearchParams();
    var user: User;
    options.append('id', userId);
    await this.http.get(this.baseUrl + 'user', { search: options }).toPromise().then(res => {
      user = res.json();
    });
    return user;
  }

  async imageUploadHandler(selection: any){
    var options: any;

    if (selection == 1) {
      options = {
        quality: 75,
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        allowEdit: true,
        encodingType: this.camera.EncodingType.JPEG,
        targetWidth: 500,
        targetHeight: 500,
        saveToPhotoAlbum: false
      };
    } else {
      options = {
        quality: 75,
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: this.camera.PictureSourceType.CAMERA,
        allowEdit: true,
        encodingType: this.camera.EncodingType.JPEG,
        targetWidth: 500,
        targetHeight: 500,
        saveToPhotoAlbum: false
      };
    }

    await this.camera.getPicture(options).then((imgUrl) => {
      var sourceDirectory = imgUrl.substring(0, imgUrl.lastIndexOf('/') + 1);
      var sourceFileName = imgUrl.substring(imgUrl.lastIndexOf('/') + 1, imgUrl.length);
      sourceFileName = sourceFileName.split('?').shift();
          this.file.copyFile(sourceDirectory, sourceFileName, cordova.file.externalApplicationStorageDirectory, sourceFileName).then((result: any) => {
        //this.imagePath = imgUrl;
        //this.imageChosen = 1;
          let imageNewPath = result.nativeURL;
          this.uploadPhoto(imgUrl, imageNewPath);    
      }, (err) => {
        alert(JSON.stringify(err));
      })
    }, (err) => {
      alert(JSON.stringify(err))
    });
  }

  
  async uploadPhoto(imagePath: string, imageNewPath: string) {
    let loader = this.loadingCtrl.create({
      content: "Please wait..."
    });
    loader.present();

    let filename = imagePath.split('/').pop();
    let options = {
      fileKey: "file",
      fileName: filename,
      chunkedMode: false,
      mimeType: "image/jpg",
      //params: { 'title': this.postTitle, 'description': this.desc }
    };

    const fileTransfer = new Transfer().create();

    await fileTransfer.upload(imageNewPath, this.baseUrl + "post/uploadImage",
      options, true).then((entry) => {
        loader.dismiss();
        this.uploadedFilename = JSON.parse(entry.response).message;
        this.presentToast("File uploaded: " + this.uploadedFilename);
      }, (err) => {
        alert(JSON.stringify(err));
        loader.dismiss();
      });
  }



  private extractComments(res: Response): Comment[] {
    let data: Comment[] = res.json().data;
    return data;
  }

  private presentToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
