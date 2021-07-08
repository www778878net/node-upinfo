'use strict';
const expect = require('chai').expect;
const UpInfo = require('../dist/index').default;
 
describe('format function uuid', () => {
    it('should return 32len str', () => {
        let up = new UpInfo();
        let result = up.getNewid().length;
  
        expect(result).to.equal(36);
    });
});
 
 