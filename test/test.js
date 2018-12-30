'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
const assert = require('assert');
const loader = require('../models/sequelize-loader');
const User = require('../models/user');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');

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
      .expect(/<a class="btn btn-info my-3" href="\/auth\/github"/)
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
      //投稿を二つ作成
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
          .post('/words')
          .send({ word: 'テストワード1', description: 'テスト説明1' })
          .expect('Location', '/')
          .expect(302)
          .end((err, res) => {
            request(app)
              .post('/words')
              .send({ word: 'テストワード2', description: 'テスト説明2' })
              .expect('Location', '/')
              .expect(302)
              .end((err, res) => {
                if (err) done(err);
                resolve();
              });
          });
      });
      
      //組み合わせが表示されているか確認
      promiseTwoWords.then(() => {
        request(app)
          .get('/')
          .expect(/ワード1/)
          .expect(/説明1/)
          .expect(/ワード2/)
          .expect(/説明2/)
          .expect(200)
          .end((err, res) => {
            //テストで作成したデータを削除
            Word.findAll({
              where: { createdBy: 0 }
            }).then((words) => {
              return Promise.all(words.map(word => deleteWordAggregate(word)));
            }).then(() => {
              if (err) return done(err);
              //console.log(res.text);
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
      //投稿を二つ作成
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
          .post('/words')
          .send({ word: 'お気に入り追加ワード1', description: 'お気に入り追加説明1' })
          .expect('Location', '/')
          .expect(302)
          .end((err, res) => {
            request(app)
              .post('/words')
              .send({ word: 'お気に入り追加ワード2', description: 'お気に入り追加説明2' })
              .expect('Location', '/')
              .expect(302)
              .end((err, res) => {
                if (err) done(err);
                resolve();
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
          .expect('{"status":"OK","favorite":1}')
          .end((err, res) => {
            Favorite.findAll({
              where: {combinationId: combination.combinationId}
            }).then((favorites) => {
              assert.equal(favorites.length, 1);
              assert.equal(favorites[0].favorite, 1);
            }).then(() => { 
              //テストで作成したものを削除
              return Favorite.findAll({
                where: { userId: userId }
              });
            }).then((favorites) => {
              favorites.map(f => f.destroy());
            }).then(() => {
              return Word.findAll({ where: { createdBy: 0 }});
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

  it('単語の説明が更新でき、組み合わせの説明も更新できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      //投稿を二つ作成
      const promiseTwoWords = new Promise((resolve) => {
        request(app)
          .post('/words')
          .send({ word: '説明更新ワード1', description: '更新説明1' })
          .expect('Location', /\//)
          .expect(302)
          .end((err, res) => {
            request(app)
              .post('/words')
              .send({ word: '説明更新ワード2', description: '更新説明2' })
              .expect('Location', /\//)
              .expect(302)
              .end((err, res) => {
                if (err) done(err);
                resolve();
              });
          });
      });

      const userId = 0;
      promiseTwoWords.then(() => {
        return Word.findOne({
          where: { createdBy: 0 },
          order: [['"wordId"', 'DESC']]
        });
      }).then((word) => {
        request(app)
          .post(`/words/${word.wordId}?edit=1`)
          .send({ description: '更新済み' })
          .expect('Location', `/users/${userId}/mywords`)
          .expect(302)
          .end((err, res) => {
            //単語の説明が更新されていることをテスト
            Word.findById(word.wordId).then((w) => {
              assert.equal(w.description, '更新済み');
            });
            //組み合わせの説明が更新されていることをテスト
            Combination.findAll({
              where: { firstWordId: word.wordId }
            }).then((combinations) => {
              combinations.forEach((c) => {
                assert.equal(c.descriptions[0], '更新済み');
              });
            });
            Combination.findAll({
              where: { secondWordId: word.wordId }
            }).then((combinations) => {
              combinations.forEach((c) => {
                assert.equal(c.descriptions[1], '更新済み');
              });
            });
            //テストで作成したものを削除
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


const deleteWordAggregate = (wordObj) => {
  return Combination.findAll({
    where: { firstWordId: wordObj.wordId }
  }).then((combinations) => {
    const promises = combinations.map(c => c.destroy());
    return Promise.all(promises);
  }).then(() => {
    return wordObj.destroy();
  });
};