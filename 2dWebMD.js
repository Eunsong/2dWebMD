(function() {
  var MdSystem = function() {
    this.DEFAULT_BODY_SIZE = 10;
    this.num_atoms = 100;
    this.ATOM_TYPES = 
    {
        OXYGEN: {radius: 12, color: 'red', mass: 1, C6: 0.126, C12: 0.0008}
    };

    this.bodies = [];
    this.unit = 1;
    var screen = document.getElementById("screen").getContext('2d');
    this.box = {x: screen.canvas.width, y: screen.canvas.height};
    while ( this.bodies.length < this.num_atoms){
      center = genRandPosition(this);
      vel = genRandVelocity(3.0);
      body = new Atom(this.ATOM_TYPES.OXYGEN, center, vel );
      if ( !this.checkOverlap(body)){
        this.bodies.push(body);
      }
    }
    //body = new Atom(this.ATOM_TYPES.OXYGEN, new Vector(100,100), new Vector(-2,0));
    //this.bodies.push(body);
    var self = this;
    var tick = function() {
      self.update();
      self.applyPBC();
      self.draw(screen);
      requestAnimationFrame(tick);
    };

    tick();
  };

  MdSystem.prototype = {

    checkOverlap: function(body){
      for ( var i = 0; i < this.bodies.length; i++){
        if ( this.bodies[i].center.sub(body.center).norm() <
             (this.bodies[i].radius + body.radius + 0.1) ){
          return true;
        }
      }
      return false;
    },

    getMinImage: function(R){
        return R;
    },

    update: function(){
      for ( var i = 0; i < this.bodies.length; i++){
        this.bodies[i].update();
      }
      reportCollisions(this.bodies);
    },

    applyPBC: function(){
      for ( var i = 0; i < this.bodies.length; i++){
        applyPBC(this, this.bodies[i]);        
      }
    },

    draw: function(screen){
      screen.clearRect(0, 0, this.box.x, this.box.y);

      for (var i = 0; i < this.bodies.length; i++) {
        if (this.bodies[i].draw !== undefined) {
          this.bodies[i].draw(screen);
        }
      }
    }

  }

  var Atom = function(atomtype, center, v0){
    this.mass = atomtype.mass;
    this.C6 = atomtype.C6;
    this.C12 = atomtype.C12;
    this.sigma = Math.pow(this.C12/this.C6, 1.0/6.0);
    this.center = new Vector(center.x, center.y);
    this.radius = atomtype.radius;
    this.velocity = new Vector(v0.x, v0.y);
  }
  Atom.prototype = {
    update: function(){
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
    },

    collision: function(body){
      Rij = this.center.sub(body.center);
      distance = Rij.norm();
      minDistance = (this.radius + body.radius);
      if ( distance <  minDistance) {
        this.center = body.center.add( Rij.multiply( minDistance/distance ));
      }
      newvelocity = new Vector(body.velocity.x, body.velocity.y);
      body.velocity = new Vector(this.velocity.x, this.velocity.y);
      this.velocity = newvelocity;
    },

    draw: function(screen){
        drawCircle(screen, this);
    }

  }

  var Vector = function(x, y){
    this.x = x;
    this.y = y;
  }
  Vector.prototype = {
    norm: function(){
      return Math.sqrt(this.x*this.x + this.y*this.y);
    },
    normsq: function(){
      return this.x*this.y + this.y*this.y;
    },
    sub: function(v){
      return new Vector(this.x - v.x, this.y - v.y);
    },
    add: function(v){
      return new Vector(this.x + v.x, this.y + v.y);
    },
    multiply: function(scalar){
      return new Vector(this.x*scalar, this.y*scalar);
    },
    dot: function(v){
      return (this.x*v.x + this.y*v.y);
    }
  }

  var applyPBC = function(mdsystem, body){
    if ( body.center.x > mdsystem.box.x ){
      body.center.x -= mdsystem.box.x;
    }
    else if ( body.center.x < 0 ){
      body.center.x += mdsystem.box.x;
    }
    if ( body.center.y > mdsystem.box.y ){
      body.center.y -= mdsystem.box.y;
    }
    else if ( body.center.y < 0 ){
      body.center.y += mdsystem.box.y;
    }
  }

  var isColliding = function(b1, b2){
    distance = getDistance(b1.center, b2.center);
    return ( distance < b1.radius + b2.radius + 0.1);
  }

  var getDistance = function(v1, v2){
    return v1.sub(v2).norm();
  }

  var getLennardJonesForce = function(mdsystem, body1, body2){
    C6 = Math.sqrt(body1.C6*body2.C6);
    C12 = Math.sqrt(body1.C12*body2.C12);
    Rorg = body1.center.sub(body2.center);
    R = mdsystem.getMinImage(Rorg).multiply(mdsystem.unit);
    rsq = R.normsq();
    return R.multiply( C12/Math.pow(rsq,7) - C6/Math.pow(rsq, 4) );
  }

  var drawCircle = function(screen, body){
    screen.beginPath();
    screen.arc(body.center.x, body.center.y, body.radius, 0, 2*Math.PI);
    screen.fillStyle = 'red';
    screen.fill();
    screen.strokeStyle = 'black';
    screen.stroke();
  }

  var reportCollisions = function(bodies) {
    var bodyPairs = [];
    for ( var i = 0; i < bodies.length; i++){
      for (var j = i+1; j < bodies.length; j++) {
        if (isColliding(bodies[i], bodies[j])) {
          //alert("Collision!");
          bodyPairs.push([bodies[i], bodies[j]]);
        }
      }
    }

    for (var i = 0; i < bodyPairs.length; i++) {
      if (bodyPairs[i][0].collision !== undefined) {
        bodyPairs[i][0].collision(bodyPairs[i][1]);
      }
    }
  };

  var genRandPosition = function(mdsystem){
    return new Vector(Math.random()*mdsystem.box.x,Math.random()*mdsystem.box.y);
  };


  var genRandVelocity = function(maxspeed){
    return new Vector(-0.5 + Math.random()*maxspeed, -0.5 + Math.random()*maxspeed);
  };

  window.addEventListener('load', function() {
    new MdSystem();
  });
})();
