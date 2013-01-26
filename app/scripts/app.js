define(['underscore'], function(_) {
  var dot3 = function(a,b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  };

  var cross3 = function(a,b) {
    return [a[1]*b[2]-a[2]*b[1],
            -(a[0]*b[2]-a[2]*b[0]),
            -(a[0]*b[1]-a[1]*b[0])];
  };

  var mag3 = function(a) {
    return Math.sqrt(dot3(a,a));
  };

  var diff3 = function(a,b) {
    return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  };

  var add3 = function(a) {
    _.each(Array.prototype.slice.call(arguments, 1), function(b) {
      a = [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
    });
    return a;
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

  var intersectPlane = function(s, p0, p1, p2) {
    var k, d1, d2, n, D;

    d1 = diff3(p1, p0);
    d2 = diff3(p2, p0);
    n = unit3(cross3(d1,d2));

    k = dot3(p0, n)/dot3(s, n);
    D = diff3(scale3(k, s), p0);

    var u = dot3(cross3(D, d2), n)/mag3(d1);
    var v = dot3(cross3(D, d1), n)/mag3(d2);

    return [u, v];
  };

  var loop2 = function(na, nb, fn) {
    var dx = 0, dy = 0;
    for(var x = 0; x < na; x++) {
      dx = 1;
      for(var y = 0; y < nb; y++) {
        dy = 1;
        fn(x, y, dx, dy);
        dx = 0;
      }
    }        
  };

  var trace = function(w,h, fn) {
    // trace over screen. x=>(0,screenwidth), y=>(0, screenheight)
    var s0 = [-1/2,-1/2,-1];
    var s1 = [1,0,0];
    var s2 = [0,1,0];
    var pw = 1/w;
    var ph = 1/h;
    loop2(w,h,function(x,y,dx,dy) {
      var u = x*pw;
      var v = (h-y)*ph;
      var s = add3(s0, scale3(u, s1), scale3(v, s2));

      fn(x, y, s);
    });
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
    var texture = ctx.getImageData(0,0,im.width,im.height);
    ctx.clearRect(0,0, $canvas.width(), $canvas.height());

    var buffer = ctx.createImageData($canvas.width(), $canvas.height());

    var clearBuffer = function() {
      loop2($canvas.width(), $canvas.height(), function(x,y,s) {
        var bpos = (y*buffer.width+x)*4;
        
        buffer.data[0+bpos] = 0;
        buffer.data[1+bpos] = 0;
        buffer.data[2+bpos] = 0;
        buffer.data[3+bpos] = 0;
      });
    };
      
    //    ctx.putImageData(texture, 0,0, 0,0,texture.width,texture.height);


    var animFrame = window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          null;

    var theta = 0;

    var pw = .5;
    var ph = .5;

    var d1 = [pw, 0, 0];
    var d2 = [0, 0, -ph];

    var p0 = [-.5,-1,-3];

    var game_loop = function () {
      clearBuffer();
      var R = axisRotationMatrix3(unit3([0,1,0]), theta);
      var dd1 = mat3mulvec3(R, d1);
      var dd2 = mat3mulvec3(R, d2);

      var p1 = add3(p0, dd1);
      var p2 = add3(p0, dd2);

      theta += 0.1;

      trace($canvas.width(), $canvas.height(), function(x,y,s) {
        var uv = intersectPlane(unit3(s), p0, p1, p2);
        if (0 <= uv[0] && uv[0] <= 1 &&
            0 <= uv[1] && uv[1] <= 1) {
          var bpos = (y*buffer.width+x)*4;
          var tposx = uv[0]*texture.width;
          var tposy = uv[1]*texture.height;

          var tpos = (Math.round(tposy)*texture.width+Math.round(tposx))*4;

          buffer.data[0+bpos] = texture.data[0+tpos];
          buffer.data[1+bpos] = texture.data[1+tpos];
          buffer.data[2+bpos] = texture.data[2+tpos];
          buffer.data[3+bpos] = texture.data[3+tpos];
        }
      });
      ctx.putImageData(buffer, 0,0, 0,0,buffer.width,buffer.height);

      animFrame(game_loop);
    };
    game_loop();
  });
  im.src = 'images/basemap.png';
});

