// ✅ Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let images = []; // { img, x, y, key }
let texts = [];  // { text, x, y, key }

let currentImage = null;
let currentImageData = null;
let placingImage = false;

let currentText = '';
let placingText = false;

let dragging = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Impact');
  textSize(32);
  textAlign(CENTER, CENTER);

  // Load images
  db.ref('images').on('value', snapshot => {
    images = [];
    const data = snapshot.val();
    if (data) {
      for (let key in data) {
        const entry = data[key];
        loadImage(entry.url, img => {
          images.push({ img, x: entry.x, y: entry.y, key });
        });
      }
    }
  });

  // Load texts
  db.ref('texts').on('value', snapshot => {
    texts = [];
    const data = snapshot.val();
    if (data) {
      for (let key in data) {
        const entry = data[key];
        texts.push({ text: entry.text, x: entry.x, y: entry.y, key });
      }
    }
  });

  // File upload
  document.getElementById('imgUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      loadImage(event.target.result, img => {
        currentImage = img;
        currentImageData = event.target.result;
        placingImage = true;
      });
    };
    reader.readAsDataURL(file);
  });

  // Add text
  document.getElementById('placeTextBtn').addEventListener('click', () => {
    const input = document.getElementById('textInput');
    if (input.value.trim() !== '') {
      currentText = input.value.toUpperCase();
      placingText = true;
    }
  });

  // Clear canvas
  document.getElementById('clearBtn').addEventListener('click', () => {
    db.ref('images').remove();
    db.ref('texts').remove();
  });
}

function draw() {
  background(255);

  // Show all images
  for (let obj of images) {
    if (obj.img) {
      const newW = 350;
      const scale = newW / obj.img.width;
      const newH = obj.img.height * scale;
      image(obj.img, obj.x, obj.y, newW, newH);
    }
  }

  // Show all texts on top
  for (let t of texts) {
    drawMemeText(t.text, t.x, t.y);
  }

  // Preview image
  if (placingImage && currentImage) {
    const newW = 120;
    const scale = newW / currentImage.width;
    const newH = currentImage.height * scale;
    tint(255, 180);
    image(currentImage, mouseX, mouseY, newW, newH);
    noTint();
  }

  // Preview text
  if (placingText && currentText) {
    drawMemeText(currentText, mouseX, mouseY);
  }
}

function mousePressed() {
  // Check image dragging
  for (let i = 0; i < images.length; i++) {
    const obj = images[i];
    const newW = 120;
    const scale = newW / obj.img.width;
    const newH = obj.img.height * scale;
    if (mouseX > obj.x && mouseX < obj.x + newW && mouseY > obj.y && mouseY < obj.y + newH) {
      dragging = { type: 'image', index: i, offsetX: mouseX - obj.x, offsetY: mouseY - obj.y };
      return;
    }
  }

  // Check text dragging
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    const w = textWidth(t.text);
    const h = 32;
    if (mouseX > t.x - w / 2 && mouseX < t.x + w / 2 && mouseY > t.y - h / 2 && mouseY < t.y + h / 2) {
      dragging = { type: 'text', index: i, offsetX: mouseX - t.x, offsetY: mouseY - t.y };
      return;
    }
  }

  // Place image
  if (placingImage && currentImage) {
    const newRef = db.ref('images').push();
    newRef.set({
      url: currentImageData,
      x: mouseX,
      y: mouseY
    });
    placingImage = false;
    currentImage = null;
  }

  // Place text
  if (placingText && currentText) {
    const newRef = db.ref('texts').push();
    newRef.set({
      text: currentText,
      x: mouseX,
      y: mouseY
    });
    placingText = false;
    currentText = '';
    document.getElementById('textInput').value = '';
  }
}

function mouseDragged() {
  if (dragging) {
    if (dragging.type === 'image') {
      const obj = images[dragging.index];
      obj.x = mouseX - dragging.offsetX;
      obj.y = mouseY - dragging.offsetY;
    } else if (dragging.type === 'text') {
      const obj = texts[dragging.index];
      obj.x = mouseX - dragging.offsetX;
      obj.y = mouseY - dragging.offsetY;
    }
  }
}

function mouseReleased() {
  if (dragging) {
    const obj = dragging.type === 'image' ? images[dragging.index] : texts[dragging.index];
    if (obj && obj.key) {
      const ref = db.ref(dragging.type === 'image' ? 'images' : 'texts').child(obj.key);
      ref.update({ x: obj.x, y: obj.y });
    }
    dragging = null;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawMemeText(txt, x, y) {
  textFont('Impact');
  textSize(32);
  textAlign(CENTER, CENTER);
  stroke(0);
  strokeWeight(6);
  fill(255);
  text(txt, x, y);
}
