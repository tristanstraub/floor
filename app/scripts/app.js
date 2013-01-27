define(['underscore'], function(_) {
  var loop2 = function(na, nb, fn) {
    var x, y, lastx = na, lasty = nb;
    for(x = 0; x < na; x++) {
      for(y = 0; y < nb; y++) {
        fn(x, y, lastx, lasty);
        lasty = y;
      }
      lasty = y;
      lastx = x;
    }        
    lastx = x;
  };

  var dot3 = function(a,b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  };

  var cross3 = function(a,b) {
    return [a[1]*b[2]-a[2]*b[1],
            -(a[0]*b[2]-a[2]*b[0]),
            +(a[0]*b[1]-a[1]*b[0])];
  };

  var mag3 = function(a) {
    return Math.sqrt(dot3(a,a));
  };

  var diff3 = function(a,b) {
    return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  };

  var add3 = function(a, b) {
    return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
  };
  
  var scale3 = function(c, x) {
    return [c*x[0],c*x[1],c*x[2]];
  };

  var scalemat3 = function(c, x) {
    var p = zeromat3();
    loop2(3,3,function(i,j) {
      p[j][i] += c * x[j][i];
    });
    return p;
  };

  var addmat3 = function(x, y) {
    var p = zeromat3();
    loop2(3,3,function(i,j) {
      p[j][i] = x[j][i] + y[j][i];
    });
    return p;
  };

  var unit3 = function(a) {
    return scale3(1/mag3(a), a);
  };

  var mat3mulvec3 = function(m, v) {
    var o = [0,0,0];
    loop2(3,3,function(i,j) {
      o[j] += m[j][i] * v[i];
    });
    return o;
  };

  var intersectPlane = function(D, d1, d2, n) {
    return [dot3(cross3(D, d2), n), dot3(cross3(D, d1), n)];
  };

  var trace = function(w,h, fn) {
    // trace over screen. x=>(0,screenwidth), y=>(0, screenheight)
    var s0 = [-1/2,-1/2,-1];
    var s1 = [1,0,0];
    var s2 = [0,1,0];

    var s1_w = scale3(1/w, s1);
    var s2_h = scale3(1/h, s2);
    var s = 0;
    for(var x = 0; x < w; x++) {
      s = s0;//add3(s0, s2);
      for(var y = 0; y < h; y++) {
        fn(x, y, s);
        s = add3(s, s2_h);
      }
      s0 = add3(s0, s1_w);
    }
  };

  var identity3 = function() {
    return [[1,0,0],
            [0,1,0],
            [0,0,1]];
  };

  var crossProductMatrix3 = function(u) {
    return [[0, -u[2], u[1]],
            [u[2], 0, -u[0]],
            [-u[1], u[0],0]];
  };

  var zeromat3 = function() {
    return [[0,0,0],[0,0,0],[0,0,0]];
  };

  var tensorProduct3 = function(u) {
    var p = zeromat3();
    loop2(3,3,function(i,j) {
      p[j][i] = u[i]*u[j];
    });
    return p;
  };

  var axisRotationMatrix3 = function(u, theta) {
    u = unit3(u);
    var I = identity3();
    var costheta = Math.cos(theta);
    var sintheta = Math.sin(theta);

    var ux = crossProductMatrix3(u);
    var uxu = tensorProduct3(u);
    var R = scalemat3(costheta, I);
    R = addmat3(R, scalemat3(sintheta, ux));
    R = addmat3(R, scalemat3(1-costheta, uxu));

    return R;
  };

  var $canvas = $('canvas');
  var canvas = $('canvas').get(0);

  var im = new Image();
  $(im).on('load', function() {
    var ctx = canvas.getContext('2d');
    ctx.drawImage(im,0,0,im.width,im.height,0,0,im.width,im.height);
//    var texture = ctx.getImageData(0,0,im.width,im.height);
   var texture = ctx.createImageData(2, 2);
    texture.data[0] = 255;
    texture.data[1] = 255;
    texture.data[2] = 255;
    texture.data[3] = 255;
    texture.data[4] = 0;
    texture.data[5] = 0;
    texture.data[6] = 0;
    texture.data[7] = 255;
    texture.data[8] = 255;
    texture.data[9] = 255;
    texture.data[10] = 255;
    texture.data[11] = 255;
    texture.data[12] = 0;
    texture.data[13] = 0;
    texture.data[14] = 0;
    texture.data[15] = 255;

    ctx.clearRect(0,0, $canvas.width(), $canvas.height());

    var buffer = ctx.createImageData($canvas.width(), $canvas.height());

    var clearBuffer = function() {
      // loop2($canvas.width(), $canvas.height(), function(x,y,s) {
      //   var bpos = (y*buffer.width+x)*4;
      
      //   buffer.data[0+bpos] = 0;
      //   buffer.data[1+bpos] = 0;
      //   buffer.data[2+bpos] = 0;
      //   buffer.data[3+bpos] = 0;
      // });
      buffer = ctx.createImageData($canvas.width(), $canvas.height());
    };

    var animFrame = window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          null;

    var theta = 0;//Math.PI/2;

    var d1 = [1, 0, 0];
    var d2 = [0, 1, 0];

    var p0 = [0,0,-10];

    var h = $canvas.height();
    var game_loop = function () {
      clearBuffer();
      var R = axisRotationMatrix3(unit3([0,0,1]), theta);
      var dd1 = mat3mulvec3(R, d1);
      var dd2 = mat3mulvec3(R, d2);
      var magdd1 = mag3(dd1);
      var magdd2 = mag3(dd2);

      var n = unit3(cross3(dd1,dd2));
      var dotp0n = dot3(p0, n);

      theta += 0.05;
      var render = function(x,y,s) {
        var bpos = ((h-y)*buffer.width+x)*4;
        var k = dotp0n/dot3(s, n);
        console.log(k,s);
        if (k >= 0) {
          var D = diff3(scale3(k, s), p0);
          var dotuv = [dot3(cross3(D, dd2), n), dot3(cross3(D, dd1), n)];
//          if (Math.abs(dotuv[0]/magdd1) <= .5 && Math.abs(dotuv[1]/magdd2)<=1) {
            var uv = [(dotuv[0]/magdd1), (dotuv[1]/magdd2)];

            var tposx = ((uv[0]*(texture.width-1) + 0.5) | 0) % texture.width;
            var tposy = ((uv[1]*(texture.height-1) + 0.5) | 0) % texture.height;

            var tpos = (tposy*texture.width+tposx)*4;
  
            buffer.data[0+bpos] = texture.data[0+tpos];
            buffer.data[1+bpos] = texture.data[1+tpos];
            buffer.data[2+bpos] = texture.data[2+tpos];
            buffer.data[3+bpos] = texture.data[3+tpos];
//          }
        }
      };
      var w = $canvas.width();
      var h = $canvas.height();
      trace(w, h, render);
      ctx.putImageData(buffer, 0,0);

//      animFrame(game_loop);
    };
    game_loop();
  });
  im.src = 'images/basemap.png';
});

