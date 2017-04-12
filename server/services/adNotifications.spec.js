/* global describe, beforeEach, afterEach, it */

const chai = require('chai');
const should = chai.should();

const MockDate = require('mockdate');
const seedrandom = require('seedrandom');

const knex_config = require('../../knexfile');
const knex = require('knex')(knex_config['test']);

const util = require('../util')({ knex });
const service = require('./adNotifications')({ knex });

const userId = 2;
const otherUserId = 1;

describe('Send notifications for ads', function() {

  beforeEach(function(done) {
    knex.migrate.rollback()
      .then(function() {
        knex.migrate.latest()
          .then(function() {
            return knex.seed.run()
              .then(function() {
                MockDate.reset();
                done();
              });
          });
      });
  });

  afterEach(function(done) {
    knex.migrate.rollback()
      .then(function() {
        done();
      });
  });

  const aDate = new Date('2017-01-13T11:00:00.000Z');
  const aDayLater = new Date('2017-01-14T11:00:00.000Z');
  const twoWeeksLater = new Date('2017-01-27T11:00:00.000Z');


  it('should not send ads to people who have just received a notification', (done) => {
    MockDate.set(aDate);
    knex('user_ad_notifications').insert({
      user_id: userId,
      ad_id: 1,
      created_at: new Date()
    }).then(() => {
      MockDate.set(aDayLater);
      return service.usersThatCanReceiveNow();
    }).then(users => {
      users.should.not.include(userId);
      done();
    })
  });

  it('should send ads to people who have not recently received a notification', (done) => {
    MockDate.set(aDate);
    knex('user_ad_notifications').insert({
      user_id: userId,
      ad_id: 1,
      created_at: new Date()
    }).then(() => {
      MockDate.set(twoWeeksLater);
      return service.usersThatCanReceiveNow();
    }).then(users => {
      users.should.include(userId);
      done();
    })
  });

  it('should send ads to people who have never received a notification', (done) => {
    service.usersThatCanReceiveNow()
      .then(users => {
        users.should.include(userId);
        done();
      })
  });

  it('should not send ads a person has received a notification about', (done) => {
    MockDate.set(aDate);
    knex('user_ad_notifications').insert({
      user_id: userId,
      ad_id: 1,
      created_at: new Date()
    }).then(() => {
      MockDate.set(twoWeeksLater);
      return service.notificationObjects();
    }).then(notifications => {
      notifications
        .find(notif => notif.userId === userId)
        .ads
        .map(ad => ad.id)
        .should.not.include(1);
      done();
    })
  });

  it('should send at most 5 ads per notification', (done) => {
    MockDate.set(aDate);
    const anAd = {
      data: {heading: "foo", content: "bar"},
      user_id: otherUserId,
      created_at: new Date()
    }
    Promise.all([
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd)
    ]).then(() => {
      MockDate.set(aDayLater);
      return service.notificationObjects();
    }).then(notifications => {
      notifications
        .find(notif => notif.userId === userId)
        .ads
        .should.have.length(5);
      done();
    })
  });

  it('should send randomly from the available ads', (done) => {
    MockDate.set(aDate);
    const anAd = {
      data: {heading: "foo", content: "bar"},
      user_id: otherUserId,
      created_at: new Date()
    }
    Promise.all([
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd),
      knex('ads').insert(anAd)
    ]).then(() => {
      MockDate.set(aDayLater);
      // these two seeds produce different orderings
      seedrandom('first', { global: true });
      return service.notificationObjects();
    }).then(notifications => {
      seedrandom('second', { global: true });
      return Promise.all([
        notifications,
        service.notificationObjects()
      ]);
    }).then(([ notifications1, notifications2 ]) => {
      notifications1.should.not.eql(notifications2);
      done();
    })

  })

  it('should not send ads of the user in question', (done) => {
    MockDate.set(aDate);
    const forcedAdId = 42;
    const anAd = {
      id: forcedAdId,
      data: {heading: "foo", content: "bar"},
      user_id: userId,
      created_at: new Date()
    }
    knex('ads').insert(anAd)
      .then(() => service.notificationObjects())
      .then(notifications => {
        const adIds = notifications
          .find(notif => notif.userId === userId)
          .ads
          .map(ad => ad.id)

        adIds.should.not.include(forcedAdId);
        adIds.should.have.length(3);
      })
    done();
  });

  it('should not send an ad that already has at least 3 answers', (done) => {
    done();
  });

  it('should not send an ad that is more than a month old', (done) => {
    done();
  });

  it('should rather send an ad with a fitting category than any old ad', (done) => {
    done();
  });

  it('should send any old ad if no categories fit', (done) => {
    done();
  });
});
