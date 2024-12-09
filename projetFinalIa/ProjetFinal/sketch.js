const flock = [];
let obstacles = [];
let vehicles = [];
let fishImage;
let requinImage;

let mode = null;

let labelNbBoids;
let imageFusee;

function preload() {
  fishImage = loadImage('assets/etoile.jpeg');
  requinImage = loadImage('assets/oiseau.jpeg');
  imageFusee = loadImage('./assets/planete.jpeg');
}

function setup() {
  createCanvas(windowWidth, windowHeight, imageFusee);

  // Position de départ pour les sliders, placés en bas de l'écran
  const posYSliderDeDepart = windowHeight - 240; 

  // Création des sliders avec position ajustée
  creerUnSlider("Poids alignment", flock, 0, 2, 1.5, 0.1, 10, posYSliderDeDepart, "alignWeight");
  creerUnSlider("Poids cohesion", flock, 0, 2, 1, 0.1, 10, posYSliderDeDepart + 30, "cohesionWeight");
  creerUnSlider("Poids séparation", flock, 0, 15, 3, 0.1, 10, posYSliderDeDepart + 60, "separationWeight");
  creerUnSlider("Poids boundaries", flock, 0, 15, 10, 1, 10, posYSliderDeDepart + 90, "boundariesWeight");
  creerUnSlider("Rayon des boids", flock, 4, 40, 6, 1, 10, posYSliderDeDepart + 120, "r");
  creerUnSlider("Perception radius", flock, 15, 60, 25, 1, 10, posYSliderDeDepart + 150, "perceptionRadius");
  // ajout des sliders maxforce et maxspeed
  creerUnSlider("maxSpeed", flock, 0.5, 10, 3, 0.1, 10, posYSliderDeDepart + 180, "maxSpeed");
  creerUnSlider("maxForce", flock, 0.1, 2, 0.5, 0.01, 10, posYSliderDeDepart + 210, "maxForce");

  // Création des véhicules poursuivants
  pursuer = new Vehicle(100, 100, imageFusee);
  vehicles.push(pursuer);
  pursuer.shape = imageFusee;

  // Ajout de boids pour le comportement de flocking
  for (let i = 0; i < 80; i++) {
    let boid = new Boid(random(width), random(height), fishImage);
    boid.r = random(20, 70);
    flock.push(boid);
  }

  // Création du label avec le nombre de boids
  labelNbBoids = createP("Nombre de boids : " + flock.length);
  labelNbBoids.style('color', 'white');
  labelNbBoids.position(10, posYSliderDeDepart - 30);

  obstacles.push(new Obstacle(width / 2, height / 2, 0, "yellow"));

  target = createVector(mouseX, mouseY);
  target.r = 50;

  // Création du requin prédateur
  requin = new Boid(width / 2, height / 2, requinImage);
  requin.r = 100;
  requin.maxSpeed = 7;
  requin.maxForce = 0.5;
}

function creerUnSlider(label, tabVehicules, min, max, val, step, posX, posY, propriete) {
  let slider = createSlider(min, max, val, step);

  let labelP = createP(label);
  labelP.position(posX, posY);
  labelP.style('color', 'white');

  slider.position(posX + 150, posY + 17);

  let valueSpan = createSpan(slider.value());
  valueSpan.position(posX + 300, posY + 17);
  valueSpan.style('color', 'white');
  valueSpan.html(slider.value());

  slider.input(() => {
    valueSpan.html(slider.value());
    tabVehicules.forEach(vehicle => {
      vehicle[propriete] = slider.value();
    });
  });
  return slider;
}

function draw() {
  background(0, 0, 0, 100);

  // Mettre à jour le nombre de boids
  labelNbBoids.html("Nombre de boids : " + flock.length);

  target.set(mouseX, mouseY);

  // Dessin de la cible
  fill(255, 0, 0);
  noStroke();
  circle(target.x, target.y, 32);

  // Dessin des obstacles
  obstacles.forEach((o) => o.show());

  // dessin des véhicules
  vehicles.forEach((v, index) => {
    if (mode === "snake") {
      let steeringForce;
      if (index === 0) {
        steeringForce = v.arrive(target, 0);
      } else {
        let previousVehicle = vehicles[index - 1];
        steeringForce = v.arrive(previousVehicle.pos, 10);
        let avoidForce = v.avoid(obstacles, true);
        steeringForce.add(avoidForce);
        v.applyBehaviors(target, obstacles, vehicles);
        v.applyForce(steeringForce);
      }
    } else {
      v.applyBehaviors(target, obstacles, vehicles);
    }
    v.update();
    v.show();
  });

 
  for (let boid of flock) {
    boid.flock(flock, obstacles, vehicles);
    boid.fleeWithTargetRadius(target);
    boid.update();
    boid.show();
  }

  // Dessin du requin
  let wanderForce = requin.wander();
  wanderForce.mult(1);
  requin.applyForce(wanderForce);

  let rayonDeDetection = 70;
  noFill();
  stroke("yellow");
  ellipse(requin.pos.x, requin.pos.y, rayonDeDetection * 2, rayonDeDetection * 2);

  let closest = requin.getVehiculeLePlusProche(flock);

  if (closest) {
    let d = p5.Vector.dist(requin.pos, closest.pos);
    if (d < rayonDeDetection) {
      let seekForce = requin.seek(closest.pos);
      seekForce.mult(7);
      requin.applyForce(seekForce);
    }
    if (d < 5) {
      let index = flock.indexOf(closest);
      flock.splice(index, 1);
    }
  }

  requin.edges();
  requin.update();
  requin.show();
}

function mousePressed() {
  obstacles.push(new Obstacle(mouseX, mouseY, random(20, 100), "yellow"));
}

function keyPressed() {
  if (key === 'a') {
    vehicles.push(new Vehicle(random(width), random(height), imageFusee));
  } else if (key === 'b') {
    Vehicle.debug = !Vehicle.debug;
    Boid.debug = !Boid.debug;
  } else if (key === 'c') {
    for (let i = 0; i < 10; i++) {
      let v = new Vehicle(20, height / 2, imageFusee);
      v.vel = createVector(random(1, 5), random(1, 5));
      vehicles.push(v);
    }
  } else if (key === 'd') {
    const b = new Boid(mouseX, mouseY, fishImage);
    b.r = random(20, 50);
    flock.push(b);
  } else if (key === 's') {
    mode = "snake";
  } else if (key === 'n' && mode === "snake") {
    mode = null;
  }
}
