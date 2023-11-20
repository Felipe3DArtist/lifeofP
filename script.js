const pi = Math.PI;

let particles, m, n, a, b, v, N, inertia, spin;
let sliders;
let friction = {
  'red_blue': 0.01,
  'blue_red': 0.01,
  'green_red': 0.01,
  'red_green': 0.01,
  'green_blue': 0.01,
  'blue_green': 0.01
};

const influenceRadius = {
  'red_blue': 0.1,
  'blue_red': 0.1,
  'green_red': 0.1,
  'red_green': 0.1,
  'green_blue': 0.1,
  'blue_green': 0.1

};

// Inverse-square law for calculating forces
const calculateForce = (color1, color2, radius) => {
  const key = `${color1}_${color2}`;
  let force = 0;

  if (radius !== 0) {
    force = radius > 0 ? 0.001 / Math.pow(radius, 2) : -0.001 / Math.pow(radius, 2);
  }

  return force;
};

// Chladni equation for patterns
const chladni = (x, y, a, b, m, n) =>
  a * Math.sin(pi * n * x) * Math.sin(pi * m * y) + b * Math.sin(pi * m * x) * Math.sin(pi * n * y);

// Particle class
class Particle {
  constructor() {
    this.reset();
    this.vx = 0;
    this.vy = 0;
    this.damping = Math.random() * 0.8 + 0.2;
    this.lifespan = Math.random() * 100 + 50;
    this.energy = 1;
    this.color = ['red', 'blue', 'green'][Math.floor(Math.random() * 3)];
    this.mass = Math.random() * 0.05 + 0.08;  // Introducing mass
    this.angularVelocity = 0;
  }

  reset() {
    this.x = Math.random();
    this.y = Math.random();
  }

  move() {
    if (v === 0 || this.energy <= 0) return;
  
    particles.forEach((other) => {
      if (other === this) return;
  
      let dx = other.x - this.x;
      let dy = other.y - this.y;
  
      // Wrap around logic for toroidal environment
      if (dx > 0.5) dx -= 1;
      if (dx < -0.5) dx += 1;
      if (dy > 0.5) dy -= 1;
      if (dy < -0.5) dy += 1;
  
      const dist = Math.sqrt(dx * dx + dy * dy);
      const key = `${this.color}_${other.color}`;
      const radius = influenceRadius[key];
  
      if (dist < Math.abs(radius)) {
        const force = calculateForce(this.color, other.color, radius);
        this.vx += force * dx;
        this.vy += force * dy;
      }
    });
  
    const eq = chladni(this.x, this.y, a, b, m, n);
    const amplitude = Math.max(v * Math.abs(eq), 0.002);
    this.vx += (noise(this.x * 1000, this.y * 1000) - 0.5) * amplitude * 2;
    this.vy += (noise(this.x * 1000, this.y * 1000) - 0.5) * amplitude * 2;
  
    this.vx *= this.damping * this.mass;
    this.vy *= this.damping * this.mass;
  
    this.x += this.vx;
    this.y += this.vy;
  
    this.vx *= inertia;
    this.vy *= inertia;
  
    // Add spin to particles
    const torque = -this.mass * this.angularVelocity * spin;
    this.angularVelocity += torque;
    const angle = Math.atan2(this.vy, this.vx);
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const newAngle = angle + this.angularVelocity;
    this.vx = speed * Math.cos(newAngle);
    this.vy = speed * Math.sin(newAngle);
  
    particles.forEach((other) => {
      if (other === this) return;
      let dx = other.x - this.x;
      let dy = other.y - this.y;
  
      // Wrap around logic for toroidal environment
      if (dx > 0.5) dx -= 1;
      if (dx < -0.5) dx += 1;
      if (dy > 0.5) dy -= 1;
      if (dy < -0.5) dy += 1;
  
      let dist = Math.sqrt(dx * dx + dy * dy);
  
      if (dist < 0.005 && dist > 0) {
        let angle = Math.atan2(dy, dx);
        let overlap = 0.005 - dist;
  
        let ax = overlap * Math.cos(angle) * 0.5;
        let ay = overlap * Math.sin(angle) * 0.5;
  
        this.x -= ax;
        this.y -= ay;
        other.x += ax;
        other.y += ay;
  
        const frictionKey = `${this.color}_${other.color}`;
        const dynamicFriction = friction[frictionKey] || 0.01;
        const relativeVelocity = {
          x: this.vx - other.vx,
          y: this.vy - other.vy
        };
        const tangentVelocity = {
          x: -relativeVelocity.y,
          y: relativeVelocity.x
        };
        const frictionMagnitude = dynamicFriction * Math.sqrt(relativeVelocity.x * relativeVelocity.x + relativeVelocity.y * relativeVelocity.y);
        const frictionForce = {
          x: frictionMagnitude * tangentVelocity.x,
          y: frictionMagnitude * tangentVelocity.y
        };
        this.vx -= frictionForce.x / this.mass;
        this.vy -= frictionForce.y / this.mass;
        other.vx += frictionForce.x / other.mass;
        other.vy += frictionForce.y / other.mass;
  
        // Apply spin to particles on collision
        const spinDiff = this.angularVelocity - other.angularVelocity;
        this.angularVelocity -= spinDiff * dynamicFriction * other.mass / this.mass;
        other.angularVelocity += spinDiff * dynamicFriction * this.mass / other.mass;
      }
    });
  
    // Toroidal boundary conditions
    if (this.x > 1) this.x -= 1;
    if (this.x < 0) this.x += 1;
    if (this.y > 1) this.y -= 1;
    if (this.y < 0) this.y += 1;
  
    stroke(this.color);
    strokeWeight(this.energy * 5);
    point(this.x * 900, this.y * 900);
    strokeWeight(1);
  }  
}

function setup() {
  createCanvas(900, 900).parent('sketch-container');  // Placeholder for dynamic canvas size
  sliders = {
    m: select('#mSlider'),
    n: select('#nSlider'),
    a: select('#aSlider'),
    b: select('#bSlider'),
    v: select('#vSlider'),
    num: select('#numSlider'),
    red_blue: select('#red_blue'),
    blue_red: select('#blue_red'),
    green_red: select('#green_red'),
    red_green: select('#red_green'),
    green_blue: select('#green_blue'),
    blue_green: select('#blue_green'),
    inertia: select('#inertiaSlider'),
    spin: select('#spinSlider'),
    friction: select('#frictionSlider')
  };
  
  particles = Array.from({ length: 100 }, () => new Particle());  // Placeholder for dynamic particle count
}

function draw() {
  background(30);
  stroke(255);

  // Update parameters based on sliders
  m = Number(sliders.m.value());
  n = Number(sliders.n.value());
  a = Number(sliders.a.value());
  b = Number(sliders.b.value());
  v = Number(sliders.v.value());
  N = Number(sliders.num.value());
  inertia = Number(sliders.inertia.value());
  spin = Number(sliders.spin.value());

  // Fetch the friction values from the sliders
  Object.keys(friction).forEach(key => {
    friction[key] = Number(sliders[key].value());
  });

  // Update particle count if changed
  if (N !== particles.length) {
    particles = Array.from({ length: N }, () => new Particle());
  }

  // Update influence radii based on sliders
  Object.keys(influenceRadius).forEach(key => {
    influenceRadius[key] = Number(sliders[key].value());
  });

  // Move each particle
  particles.forEach(particle => particle.move());
}