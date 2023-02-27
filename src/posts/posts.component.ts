import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  combineLatest,
  concat,
  map,
  Observable,
  switchMap,
  toArray,
  from,
  mergeMap,
  forkJoin,
  tap,
} from 'rxjs';
//import chunk from 'lodash/chunk';

const API_URL = 'https://jsonplaceholder.typicode.com/';
interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
  comments?: Comment[];
}
interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
  post?: Post;
}
@Component({
  selector: 'posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class PostsComponent implements OnInit {
  posts$: Observable<Post[]>;
  comments$: Observable<Comment[][]>;
  postsWithComments$: Observable<Post[]>;

  constructor(private httpClient: HttpClient) {}

  ngOnInit(): void {
    //this.loadPostsParalelo();
    //this.loadPostsSerie();
    this.loadPostsChunksMergeMap2();
    //this.postsWithComments$ = this.appendCommentsToPosts();
  }

  /**
   * Todas las solicitudes se lanzan al mismo tiempo.
   * Dejando al navegador decidir cuales hacer en paralelo
   */
  loadPostsParalelo(): void {
    this.posts$ = this.httpClient.get<Post[]>(API_URL + 'posts');
    this.comments$ = this.posts$.pipe(
      switchMap((posts: Post[]) => {
        const commentObervables = posts.map(({ id }) =>
          this.loadCommentsOfPost(id)
        );
        const commentObervables$ = combineLatest(commentObervables);
        return commentObervables$;
      })
    );
  }

  /**
   * Todas las solicitudes se lanzan en serie.
   * Termina una y se busca su dependiente, luego el proximo.
   */
  loadPostsSerie(): void {
    this.posts$ = this.httpClient.get<Post[]>(API_URL + 'posts');
    this.comments$ = this.posts$.pipe(
      switchMap((posts: Post[]) => {
        const commentObervables = posts.map(({ id }) =>
          this.loadCommentsOfPost(id)
        );
        const commentObervables$ = concat(...commentObervables).pipe(toArray());
        return commentObervables$;
      })
    );
  }

  /**
   * Todas las solicitudes se lanzan de N en N.
   * Termina una y se busca su dependiente, luego el proximo.
   */
  // loadPostsChunks(): void {
  //   this.posts$ = this.httpClient.get<Post[]>(API_URL + 'posts');
  //   this.comments$ = this.posts$.pipe(
  //     switchMap((posts: Post[]) => {
  //       const commentObervables = posts.map(({ id }) =>
  //         this.loadCommentsOfPost(id)
  //       );

  //       const chunkSize = Math.ceil(commentObervables?.length / 4);
  //       const chunkedCommentObervables$ = chunk(commentObervables, chunkSize);

  //       const commentObervables$ = combineLatest(
  //         chunkedCommentObervables$.map((chunk) =>
  //           concat(...chunk).pipe(toArray())
  //         )
  //       ).pipe(map((chunkResults: unknown[]) => chunkResults.flat(1)));
  //       return commentObervables$;
  //     })
  //   );
  // }

  /**
   * Todas las solicitudes se lanzan de N en N.
   * Termina una y se busca su dependiente, luego el proximo.
   */
  loadPostsChunksMergeMap(): void {
    this.posts$ = this.httpClient.get<Post[]>(API_URL + 'posts');
    this.comments$ = this.posts$.pipe(
      switchMap((posts: Post[]) => {
        const commentObervables$ = from(posts).pipe(
          mergeMap(({ id }) => this.loadCommentsOfPost(id), 4),
          toArray()
          // meter los post dentro del comment respectivo
          // map((commentsForAllPosts: Comment[][]) => {
          //   return commentsForAllPosts.map((commentsForSinglePost) => {
          //     return commentsForSinglePost.map((singleComment) => {
          //       return {
          //         ...singleComment,
          //         post: posts.find(
          //           (singlePost) => singlePost.id === singleComment.postId
          //         ),
          //       };
          //     });
          //   });
          // })
        );

        return commentObervables$;
      })
    );
  }

  /**
   * Todas las solicitudes se lanzan de N en N.
   * Termina una y se busca su dependiente, luego el proximo.
   */
  loadPostsChunksMergeMap2(): void {
    this.posts$ = this.httpClient.get<Post[]>(API_URL + 'posts');
    this.postsWithComments$ = this.posts$.pipe(
      switchMap((posts: Post[]) => {
        const commentObervables$ = from(posts).pipe(
          mergeMap(
            (post) =>
              this.loadCommentsOfPost(post.id).pipe(
                tap((result) => console.log(result, post.id)),
                map((comments) => ({ ...post, comments }))
              ),
            4
          ),
          toArray()
        );
        return commentObervables$;
      })
    );
  }
  appendCommentsToPosts(): Observable<Post[]> {
    const postsAndComments$ = forkJoin({
      posts: this.posts$,
      comments: this.comments$,
    });
    return postsAndComments$.pipe(
      map(({ posts, comments }) => {
        return posts.map((post) => {
          let allCommentsOfThisPost = [];
          comments.forEach((individualArrayOfComments) => {
            const commentOfThisPost = individualArrayOfComments.filter(
              (singleComment) => singleComment.postId === post.id
            );
            if (commentOfThisPost)
              allCommentsOfThisPost = [
                ...allCommentsOfThisPost,
                ...commentOfThisPost,
              ];
          });
          return {
            ...post,
            comments: [...allCommentsOfThisPost],
          };
        });
      })
    );
  }

  loadCommentsOfPost(postId: number): Observable<Comment[]> {
    return this.httpClient.get<Comment[]>(API_URL + `posts/${postId}/comments`);
  }
}
