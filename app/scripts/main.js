require.config({
  shim: {
    'underscore':{
      exports: '_'
    }
  },

  paths: {
    'underscore': '../../components/underscore/underscore',
    hm: 'vendor/hm',
    esprima: 'vendor/esprima',
    jquery: 'vendor/jquery.min'
  }
});
 
require(['app'], function(app) {



});
