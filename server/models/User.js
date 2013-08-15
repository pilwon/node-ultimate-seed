/*
 * server/models/User.js
 */

'use strict';

var util = require('util');

var _ = require('lodash'),
    bcrypt = require('bcrypt'),
    ultimate = require('ultimate');

var mongoose = ultimate.lib.mongoose,
    plugin = ultimate.db.mongoose.plugin,
    type = ultimate.db.mongoose.type;

var app = require('../app');

// Schema
var schema = new mongoose.Schema({
  email: { type: type.Email, required: true },
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true }
  },
  accessToken: { type: String },
  auth: {
    local: {
      username: { type: type.Email },
      password: { type: String }
    },
    facebook: {
      id: { type: String },
      token: { type: String },
      profile: { type: type.Mixed }
    },
    google: {
      id: { type: String },
      token: { type: String },
      profile: { type: type.Mixed }
    },
    twitter: {
      id: { type: String },
      token: { type: String },
      profile: { type: type.Mixed }
    }
  },
  roles: [{ type: String }]
});

// Restify
schema.restify = {
  'list': {
    'admin': '*',
    'user': ['name.first']
  },
  'get': {
    'admin': '*',
    'user': ['name.first']
  },
  'post': {
    'admin': '*',
  },
  'put': {
    'admin': '*',
  },
  'delete': {
    'admin': '*'
  }
};

// Indexes
schema.path('email').index({ unique: true });
schema.path('accessToken').index({ unique: true });
schema.path('auth.local.username').index({ unique: true, sparse: true });
schema.path('auth.facebook.id').index({ unique: true, sparse: true });
schema.path('auth.google.id').index({ unique: true, sparse: true });
schema.path('auth.twitter.id').index({ unique: true, sparse: true });

// Virtuals
schema.virtual('name.full').get(function () {
  return this.name.first + ' ' + this.name.last;
});
schema.virtual('name.full').set(function (name) {
  var split = name.split(' ');
  if (split.length >= 2) {
    this.name.last = split.splice(split.length - 1).join(' ');
  } else {
    this.name.last = '';
  }
  this.name.first = split.join(' ');
});

// Plugins
schema.plugin(plugin.findOrCreate);
schema.plugin(plugin.timestamps);

// Bcrypt middleware
schema.pre('save', function (next) {
  var SALT_WORK_FACTOR = 10,
      user = this;

  if (!user.isModified('auth.local.password')) {
    return next();
  }

  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) { return next(err); }

    bcrypt.hash(user.auth.local.password, salt, function (err, hash) {
      if (err) { return next(err); }
      user.auth.local.password = hash;
      next();
    });
  });
});

// Password verification
schema.methods.comparePassword = function (candidatePassword, cb) {
  var user = this;
  bcrypt.compare(candidatePassword, user.auth.local.password, cb);
};

/**
 * Facebook auth
 */
schema.statics.findOrCreateFacebook = function (accessToken, refreshToken, profile, cb) {
  // console.log(profile._json);
  var data = {
    email: profile._json.email,
    name: {
      /* jshint camelcase: false */
      first: profile._json.first_name,
      last: profile._json.last_name
      /* jshint camelcase: true */
    },
    'auth.facebook': {
      id: profile.id,
      token: accessToken,
      profile: profile._json
    }
  };
  app.models.User.findOneAndUpdate({
    email: data.email
  }, _.omit(data, ['email', 'name']), function (err, user) {
    if (err) { return cb(err); }
    if (user) {
      // Updated existing account.
      return cb(null, user);
    } else {
      // Create new account.
      app.models.User.create(data, cb);
    }
  });
};

/**
 * Google auth
 */
schema.statics.findOrCreateGoogle = function (accessToken, refreshToken, profile, cb) {
  // console.log(profile._json);
  var data = {
    email: profile._json.email,
    name: {
      /* jshint camelcase: false */
      first: profile._json.given_name,
      last: profile._json.family_name
      /* jshint camelcase: true */
    },
    'auth.google': {
      id: profile.id,
      token: accessToken,
      profile: profile._json
    }
  };
  app.models.User.findOneAndUpdate({
    email: data.email
  }, _.omit(data, ['email', 'name']), function (err, user) {
    if (err) { return cb(err); }
    if (user) {
      // Updated existing account.
      return cb(null, user);
    } else {
      // Create new account.
      app.models.User.create(data, cb);
    }
  });
};

/**
 * Twitter auth
 *
 * Twitter API doesn't provide e-mail, therefore
 * a fake e-mail address is generated in order to
 * pass field requirement validation.
 * E-mail may be updated by other auth strategies.
 */
schema.statics.findOrCreateTwitter = function (token, tokenSecret, profile, cb) {
  // console.log(profile._json);
  var data = {
    email: util.format('%s@%s.twitter.id',
                       ultimate.util.uuid({ dash: false }),
                       profile.id),
    name: {
      first: profile._json.name.split(' ').slice(0, -1).join(' '),
      last: profile._json.name.split(' ').slice(-1).join(' ')
    },
    'auth.twitter': {
      id: profile.id,
      token: token,
      profile: profile._json
    }
  };
  app.models.User.findOneAndUpdate({
    'auth.twitter.id': profile.id
  }, _.omit(data, ['email', 'name']), function (err, user) {
    if (err) { return cb(err); }
    if (user) {
      // Updated existing account.
      return cb(null, user);
    } else {
      // Create new account.
      app.models.User.create(data, cb);
    }
  });
};

// Model
var model = mongoose.model('User', schema);

// Public API
exports = module.exports = model;
