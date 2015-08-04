'use strict';

// Test specific configuration
// ===========================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/afrostreamadmin-test'
  },
  sequelize: {
    uri: 'postgres://',
    options: {
      logging: false,
      storage: 'test.postgres',
      define: {
        timestamps: false
      }
    }
  }
};
