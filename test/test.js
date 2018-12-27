'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
var User = require('../models/user');
var Word = require('../models/word');
var Combination = require('../models/combination');
var Favorite = require('../models/favorite');

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
          .send({ word: 'ワード1', description: '説明1' })
          .expect('Location', /\//)
          .expect(302)
          .end((err, res) => {
            request(app)
              .post('/words')
              .send({ word: 'ワード2', description: '説明2' })
              .expect('Location', /\//)
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
              return Promise.all(words.map((word) => { return deleteWordAggregate(word); }));
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
    const promises = combinations.map((c) => { return c.destroy(); });
    return Promise.all(promises);
  }).then(() => {
    return wordObj.destroy();
  });
};