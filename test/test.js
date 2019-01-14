'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
const assert = require('assert');
const User = require('../models/user');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
const Comment = require('../models/comment');
const deleteWordAggregate = require('../routes/word').deleteWordAggregate;

describe('/login', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  })
  
  it('ログインのためのリンクが含まれる', (done) => {
    request(app)
      .get('/login')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a class="btn btn-main-color" href="\/auth\/github"/)
      .expect(200, done);
  });

  it('ログイン時はユーザー名が表示される', (done) => {
    request(app)
      .get('/login')
      .expect(/testuser/)
      .expect(200, done);
  });

  it('/logout にアクセスした際に / にリダイレクトされる', (done) => {
    request(app)
      .get('/logout')
      .expect('Location', '/')
      .expect(302, done);
  });
});

describe('/words', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('投稿が作成でき、組み合わせが表示される', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      //投稿を2つ作成
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
          .get('/words/new')
          .end((err, res) => {
            const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
            const csrf = match[1];
            const setCookie = res.headers['set-cookie'];

            request(app)
              .post('/words')
              .set('cookie', setCookie)
              .send({ word: '単語投稿ワード1', description: '単語投稿説明1', _csrf: csrf })
              .expect('Location', '/')
              .expect(302)
              .end((err, res) => {
                request(app)
                  .post('/words')
                  .set('cookie', setCookie)
                  .send({ word: '単語投稿ワード2', description: '単語投稿説明2', _csrf: csrf })
                  .expect('Location', '/')
                  .expect(302)
                  .end((err, res) => {
                    if (err) done(err);
                    resolve();
                  });
              });
          });
      });

      //組み合わせが表示されているか確認
      promiseTwoWords.then(() => {
        request(app)
          .get('/')
          .expect(/単語投稿ワード1/)
          .expect(/単語投稿説明1/)
          .expect(/単語投稿ワード2/)
          .expect(/単語投稿説明2/)
          .expect(200)
          .end((err, res) => {
            //テストで作成したデータを削除
            Word.findAll({
              where: { createdBy: 0 }
            }).then((words) => {
              return Promise.all(words.map(word => deleteWordAggregate(word)));
            }).then(() => {
              if (err) return done(err);
              done();
            });
          });
      });

    });
  });  
});

describe('/users/:userId/combinations/:combinationId', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('お気に入りに追加できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
     //投稿を2つ作成
     const promiseTwoWords = new Promise((resolve) => {
      request(app)
        .get('/words/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          const csrf = match[1];
          const setCookie = res.headers['set-cookie'];

          request(app)
            .post('/words')
            .set('cookie', setCookie)
            .send({ word: 'お気に入り追加ワード1', description: 'お気に入り追加説明1', _csrf: csrf })
            .expect('Location', '/')
            .expect(302)
            .end((err, res) => {
              request(app)
                .post('/words')
                .set('cookie', setCookie)
                .send({ word: 'お気に入り追加ワード2', description: 'お気に入り追加説明2', _csrf: csrf })
                .expect('Location', '/')
                .expect(302)
                .end((err, res) => {
                  if (err) done(err);
                  resolve();
                });
            });
        });
    });

      //お気に入りに追加できることをテスト
      const userId = 0;
      promiseTwoWords.then(() => {
        return Word.findOne({
          where: { createdBy: userId },
          order: [['"wordId"', 'DESC']]
        });
      }).then((word) => {
        return Combination.findOne({
          wehre: { firstWordId: word.wordId },
          order: [['"combinationId"', 'DESC']]
        });
      }).then((combination) => {
        request(app)
          .post(`/users/${userId}/combinations/${combination.combinationId}`)
          .send({ favorite: 1 }) //お気に入りに追加
          .expect('{"status":"OK","favorite":1,"favoriteCounter":1}')
          .end((err, res) => {
            Favorite.findAll({
              where: {combinationId: combination.combinationId}
            }).then((favorites) => {
              assert.equal(favorites.length, 1);
              assert.equal(favorites[0].favorite, 1);
              //テストで作成したものを削除
              return Word.findAll({ where: { createdBy: userId }});
            }).then((words) => {
              return Promise.all(words.map(word => deleteWordAggregate(word)));
            }).then(() => {
              if (err) return done(err);
              done();
            });
          });
      });
    });
  });
});

describe('/words/:wordId?edit=1', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('単語の説明が更新できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      //投稿を2つ作成
      let csrf = null;
      let setCookie = null;
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
        .get('/words/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          csrf = match[1];
          setCookie = res.headers['set-cookie'];

          request(app)
            .post('/words')
            .set('cookie', setCookie)
            .send({ word: '更新ワード1', description: '更新説明1', _csrf: csrf })
            .expect('Location', '/')
            .expect(302)
            .end((err, res) => {
              request(app)
                .post('/words')
                .set('cookie', setCookie)
                .send({ word: '更新ワード2', description: '更新説明2', _csrf: csrf })
                .expect('Location', '/')
                .expect(302)
                .end((err, res) => {
                  if (err) done(err);
                  resolve();
                });
            });
        });
      });

      const userId = 0;
      promiseTwoWords.then(() => {
        return Word.findOne({
          where: { createdBy: userId },
          order: [['"wordId"', 'DESC']]
        });
      }).then((word) => {
        request(app)
          .post(`/words/${word.wordId}?edit=1`)
          .set('cookie', setCookie)
          .send({ description: '更新済み', _csrf: csrf })
          .expect('Location', `/users/${userId}/mywords`)
          .expect(302)
          .end((err, res) => {
            //単語の説明が更新されていることをテスト
            Word.findById(word.wordId).then((w) => {
              assert.equal(w.description, '更新済み');
            }).then(() => {
              return Word.findAll({ where: { createdBy: userId } });
            }).then((words) => {
              return Promise.all(words.map(word => deleteWordAggregate(word)));
            }).then(() => {
              if (err) return done(err);
              done();
            });
          });
      });
    });
  });
});

describe('combinations/:combinationId/comments', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('コメントが投稿できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      //投稿を二つ作成
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
          .get('/words/new')
          .end((err, res) => {
            const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
            const csrf = match[1];
            const setCookie = res.headers['set-cookie'];
  
            request(app)
              .post('/words')
              .set('cookie', setCookie)
              .send({ word: 'コメント投稿ワード1', description: 'コメント投稿説明1', _csrf: csrf })
              .expect('Location', '/')
              .expect(302)
              .end((err, res) => {
                request(app)
                  .post('/words')
                  .set('cookie', setCookie)
                  .send({ word: 'コメント投稿ワード2', description: 'コメント投稿説明2', _csrf: csrf })
                  .expect('Location', '/')
                  .expect(302)
                  .end((err, res) => {
                    if (err) done(err);
                    resolve();
                  });
              });
          });
      });

      const userId = 0;
      promiseTwoWords.then(() => {
        return Word.findOne({
          where: { createdBy: userId },
          order: [['"wordId"', 'DESC']]
        });
      }).then((word) => {
        return Combination.findOne({
          where: { firstWordId: word.wordId },
          order: [['"combinationId"', 'DESC']]
        });
      }).then((combination) => {
        //コメント作成
        request(app)
          .post(`/combinations/${combination.combinationId}/comments`)
          .send({ comment: 'テストコメント' })
          .expect((res) => {
            res.status.should.equal(200);
            res.body.should.have.property('comment');
            res.body.should.have.property('commentCounter');
            res.body.commentCounter.should.equal(1);
          })
          .end((err, res) => {
            Comment.findAll({
              where: { combinationId: combination.combinationId }
            }).then((comments) => {
              assert.equal(comments.length, 1);
              assert.equal(comments[0].comment, 'テストコメント');
              //テストで作成したものを削除
              return Word.findAll({ where: { createdBy: userId } });
            }).then((words) => {
              return Promise.all(words.map(word => deleteWordAggregate(word)));
            }).then(() => {
              if (err) return done(err);
              done();
            });
          });
      });


    });
  });
});

describe('/combinations/:combinationId/comments/:commentId?delete=1', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('コメントが削除できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      //投稿を二つ作成
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
          .get('/words/new')
          .end((err, res) => {
            const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
            const csrf = match[1];
            const setCookie = res.headers['set-cookie'];
  
            request(app)
              .post('/words')
              .set('cookie', setCookie)
              .send({ word: 'コメント削除ワード1', description: 'コメント削除説明1', _csrf: csrf })
              .expect('Location', '/')
              .expect(302)
              .end((err, res) => {
                request(app)
                  .post('/words')
                  .set('cookie', setCookie)
                  .send({ word: 'コメント削除ワード2', description: 'コメント削除説明2', _csrf: csrf })
                  .expect('Location', '/')
                  .expect(302)
                  .end((err, res) => {
                    if (err) done(err);
                    resolve();
                  });
              });
          });
      });

      const userId = 0;
      const promiseComment = promiseTwoWords.then(() => {
        return Word.findOne({
          where: { createdBy: userId },
          order: [['"wordId"', 'DESC']]
        });
      }).then((word) => {
        return Combination.findOne({
          where: { firstWordId: word.wordId },
          order: [['"combinationId"', 'DESC']]
        });
      }).then((combination) => {
        return new Promise((resolve) => {
          request(app)
          //コメント作成
          .post(`/combinations/${combination.combinationId}/comments`)
          .send({ comment: 'テストコメント' })
          .expect(200)
          .expect((res)=>{
            res.body.should.have.property('comment');
            res.body.should.have.property('commentCounter');
            res.body.commentCounter.should.equal(1);
          })
          .end((err, res) => {
            Comment.findAll({
              where: { combinationId: combination.combinationId }
            }).then((comments) => {
              assert.equal(comments.length, 1);
              assert.equal(comments[0].comment, 'テストコメント');
              resolve(comments[0]);
            });
          });
        });
      });

      //コメント削除
      const promisecommentDeleted = promiseComment.then((comment) => {
        return new Promise((resolve) => {
          request(app)
          .post(`/combinations/${comment.combinationId}/comments/${comment.commentNumber}?delete=1`)
          .expect('{"status":"OK","commentCounter":0}')
          .end((err, res) => {
            if (err) return done(err);
            resolve(comment);
          });
        });
      });

      //テスト
      promisecommentDeleted.then((comment) => {
        return Comment.findAll({
          where: { combinationId: comment.combinationId }
        });
      }).then((comments) => {
        assert.equal(comments.length, 0);
        //テストで作成したものを削除
        return Word.findAll({ where: { createdBy: userId } });
      }).then((words) => {
        return Promise.all(words.map(word => deleteWordAggregate(word)));
      }).then(() => {
        done();
      });
    });
  });
});

describe('/words/:wordId?delete=1', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('単語に関連する全ての情報が削除できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      //投稿を二つ作成
      let csrf = null;
      let setCookie = null;
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
        .get('/words/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          csrf = match[1];
          setCookie = res.headers['set-cookie'];

          request(app)
            .post('/words')
            .set('cookie', setCookie)
            .send({ word: '単語削除ワード1', description: '単語削除説明1', _csrf: csrf })
            .expect('Location', '/')
            .expect(302)
            .end((err, res) => {
              request(app)
                .post('/words')
                .set('cookie', setCookie)
                .send({ word: '単語削除ワード2', description: '単語削除説明2', _csrf: csrf })
                .expect('Location', '/')
                .expect(302)
                .end((err, res) => {
                  if (err) done(err);
                  resolve();
                });
            });
        });
      });

      const userId = 0;
      let storedWordId = null;
      let storedCombinationId = null;
      const promiseCommentAndFavorite = promiseTwoWords.then(() => {
        return Word.findOne({
          where: { createdBy: userId },
          order: [['"wordId"', 'DESC']]
        });
      }).then((word) => {
        storedWordId = word.wordId;
        return Combination.findOne({
          where: { firstWordId: word.wordId },
          order: [['"combinationId"', 'DESC']]
        });
      }).then((combination) => {
        storedCombinationId = combination.combinationId;
        //コメント作成
        return new Promise((resolve) => {
          request(app)
            .post(`/combinations/${combination.combinationId}/comments`)
            .send({ comment: 'テストコメント' })
            .expect(200)
            .expect((res) => {
              res.body.should.have.property('comment');
              res.body.should.have.property('commentCounter');
              res.body.commentCounter.should.equal(1);
            })
            .end((err, res) => {
              if (err) done(err);
              resolve();
            });
        });
      }).then(() => {
        //お気に入りに追加
        return new Promise((resolve) => {
          request(app)
            .post(`/users/${userId}/combinations/${storedCombinationId}`)
            .send({ favorite: 1 })
            .expect('{"status":"OK","favorite":1,"favoriteCounter":1}')
            .end((err, res) => {
              if (err) done(err);
              resolve();
            });
        });
      });

      //単語を削除
      const promiseDeleted = promiseCommentAndFavorite.then(() => {
        return new Promise((resolve) => {
          request(app)
            .post(`/words/${storedWordId}?delete=1`)
            .set('cookie', setCookie)
            .send({_csrf: csrf})
            .end((err, res) => {
              if (err) done(err);
              resolve();
            });
        });
      });

      //テスト
      promiseDeleted.then(() => {
        const p1 = Comment.findAll({
          where: { combinationId: storedCombinationId }
        }).then((comment) => {
          assert.equal(comment.length, 0);
        });
        const p2 = Favorite.findAll({
          where: { combinationId: storedCombinationId }
        }).then((favorite) => {
          assert.equal(favorite.length, 0);
        });
        const p3 = Combination.findAll({
          where: { firstWordId: storedWordId }
        }).then((combinations) => {
          assert.equal(combinations.length, 0);
        });
        const p4 = Word.findById(storedWordId).then((word) => {
          assert.equal(!word, true);
        });
        //テストで作成したものを削除
        Promise.all([p1, p2, p3, p4]).then(() => {
          return Word.findAll({ where: { createdBy: userId } });
        }).then((words) => {
          return Promise.all(words.map(word => deleteWordAggregate(word)));
        }).then(() => {
          done();
        });

      });
    });
  });
});

describe('/users/:userId/mywords', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('自分が投稿一覧が表示できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
     //投稿を二つ作成
     const promiseTwoWords = new Promise((resolve) => {
      request(app)
        .get('/words/new')
        .end((err, res) => {
          const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
          const csrf = match[1];
          const setCookie = res.headers['set-cookie'];

          request(app)
            .post('/words')
            .set('cookie', setCookie)
            .send({ word: '投稿一覧ワード1', description: '投稿一覧説明1', _csrf: csrf })
            .expect('Location', '/')
            .expect(302)
            .end((err, res) => {
              request(app)
                .post('/words')
                .set('cookie', setCookie)
                .send({ word: '投稿一覧ワード2', description: '投稿一覧説明2', _csrf: csrf })
                .expect('Location', '/')
                .expect(302)
                .end((err, res) => {
                  if (err) done(err);
                  resolve();
                });
            });
        });
    });
  
      //自分の投稿一覧ページに投稿した単語が表示されているか確認
      const userId = 0;
      promiseTwoWords.then(() => {
        request(app)
          .get(`/users/${userId}/mywords`)
          .expect(/投稿一覧ワード1/)
          .expect(/投稿一覧説明1/)
          .expect(/投稿一覧ワード2/)
          .expect(/投稿一覧説明2/)
          .expect(200)
          .end((err, res) => {
            Word.findAll({
              where: { createdBy: userId }
            }).then((words) => {
              return Promise.all(words.map(word => deleteWordAggregate(word)));
            }).then(() => {
              if (err) return done(err);
              done();
            });
          });
      });
    });
  });
});

describe('/users/:userId/favorites', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('自分のお気に入り一覧が表示される', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      //投稿を二つ作成
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
          .get('/words/new')
          .end((err, res) => {
            const match = res.text.match(/<input type="hidden" name="_csrf" value="(.*?)">/);
            const csrf = match[1];
            const setCookie = res.headers['set-cookie'];
  
            request(app)
              .post('/words')
              .set('cookie', setCookie)
              .send({ word: 'お気に入り一覧ワード1', description: 'お気に入り一覧説明1', _csrf: csrf })
              .expect('Location', '/')
              .expect(302)
              .end((err, res) => {
                request(app)
                  .post('/words')
                  .set('cookie', setCookie)
                  .send({ word: 'お気に入り一覧ワード2', description: 'お気に入り一覧説明2', _csrf: csrf })
                  .expect('Location', '/')
                  .expect(302)
                  .end((err, res) => {
                    if (err) done(err);
                    resolve();
                  });
              });
          });
      });

      //お気に入りに追加
      const userId = 0;
      const promiseFavorite = promiseTwoWords.then(() => {
        return Word.findOne({
          where: { createdBy: userId },
          order: [['"wordId"', 'DESC']]
        });
      }).then((word) => {
        return Combination.findOne({
          where: { firstWordId: word.wordId },
          order: [['"combinationId"', 'DESC']]
        });
      }).then((combination) => {
        return new Promise((resolve) => {
          request(app)
            .post(`/users/${userId}/combinations/${combination.combinationId}`)
            .send({ favorite: 1 })
            .expect('{"status":"OK","favorite":1,"favoriteCounter":1}')
            .end((err, res) => {
              if (err) done(err);
              resolve();
            });
        });
      });

      //テスト
      promiseFavorite.then(() => {
        request(app)
          .get(`/users/${userId}/favorites`)
          .expect(/お気に入り一覧ワード1/)
          .expect(/お気に入り一覧説明1/)
          .expect(/お気に入り一覧ワード2/)
          .expect(/お気に入り一覧説明2/)
          .expect(200)
          .end((err, res) => {
            Word.findAll({
              where: { createdBy: userId }
            }).then((words) => {
              return Promise.all(words.map(word => deleteWordAggregate(word)));
            }).then(() => {
              if (err) return done(err);
              done();
            });
          });
      });
    });
  });
});

