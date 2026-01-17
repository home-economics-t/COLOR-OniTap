const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("message");
const slashes = [];
const slashSound = new Audio("assets/slash.mp3");
slashSound.volume = 0.5;
const oniImages = {
  red: new Image(),
  blue: new Image(),
  yellow: new Image()
};

oniImages.red.src = "assets/onired.png";
oniImages.blue.src = "assets/oniblue.png";
oniImages.yellow.src = "assets/oniyellow.png";


let currentBreath = "red";
let score = 0;
let gameTime = 30;
let timerId = null;
let spawnId = null;
let gameActive = false;


const COLORS = ["red", "blue", "yellow"];
const onis = [];

// ===== 鬼クラス =====
class Oni {
  constructor() {
    this.r = 30;
    this.x = Math.random() * (canvas.width - this.r * 2) + this.r;
    this.y = Math.random() * (canvas.height - this.r * 2) + this.r;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alive = true;
    this.scale = 1;
    this.alpha = 1;
    this.life = 250; // フレーム数（約3秒）
  }

  draw() {
    const img = oniImages[this.color];
    const size = this.r * 2 * this.scale;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.drawImage(
      img,
      this.x - size / 2,
      this.y - size / 2,
      size,
      size
    );
    ctx.restore();
  }

  hitTest(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.r;
  }
}

// ===== 鬼生成 =====
function spawnOni() {
  if (!gameActive) return;

  const count = Math.floor(Math.random() * 3) + 1; // 1〜3体

  for (let i = 0; i < count; i++) {
    onis.push(new Oni());
  }
}

// ===== ゲーム制御 =====
function startGame() {
  // 初期化
  onis.length = 0;
  score = 0;
  scoreEl.textContent = score;
  gameTime = 30;
  timerEl.textContent = `残り時間：${gameTime}`;
  messageEl.textContent = "";

  gameActive = true;
  startBtn.disabled = true;

  // 👇 これが無かった
  spawnId = setInterval(spawnOni, 1200);

  timerId = setInterval(() => {
    gameTime--;
    timerEl.textContent = `残り時間：${gameTime}`;

    if (gameTime <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false;

  clearInterval(timerId);
  clearInterval(spawnId); // 👈 これも大事

  startBtn.disabled = false;
  messageEl.textContent = `修行終了！ スコア：${score}`;
}

// ===== 斬撃エフェクト =====

function addSlash(x, y, color) {
  slashes.push({
    x,
    y,
    life: 8,
    color
  });
}


// ===== 描画ループ =====
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 鬼の描画
 onis.forEach(oni => {
  if (!oni.alive) return;

  oni.life--;

  if (oni.life <= 0) {
    oni.alive = false;
  }

  oni.draw();
});


  // 👇 斬撃エフェクト描画
  for (let i = slashes.length - 1; i >= 0; i--) {
    const s = slashes[i];

    ctx.strokeStyle = s.color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s.x - 25, s.y - 25);
    ctx.lineTo(s.x + 25, s.y + 25);
    ctx.stroke();

    s.life--;
    if (s.life <= 0) {
      slashes.splice(i, 1);
    }
  }

  requestAnimationFrame(update);
}

// ===== タップ処理 =====
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

　addSlash(x, y, currentBreath);

　playSlashSound();
　addSlash(x, y, currentBreath);


  onis.forEach((oni) => {
    if (!oni.alive) return;

    if (oni.hitTest(x, y)) {
      if (oni.color === currentBreath) {
        defeatOni(oni);
      } else {
        missEffect();
      }
    }
  });
});

// ===== 鬼を倒す =====
function defeatOni(oni) {
  oni.alive = false;
  score += 10;
  scoreEl.textContent = score;

  // 簡易エフェクト
  let t = 0;
  const effect = () => {
    t += 0.1;
    oni.scale += 0.05;
    oni.alpha -= 0.1;
    if (oni.alpha > 0) {
      requestAnimationFrame(effect);
    }
  };
  effect();
}

// ===== ミス演出 =====
function missEffect() {
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ===== 呼吸切り替え =====
document.querySelectorAll("button[data-color]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentBreath = btn.dataset.color;

    document.querySelectorAll("button[data-color]").forEach(b => {
      b.classList.remove("active");
    });

    btn.classList.add("active");
  });
});

document.querySelector('button[data-color="red"]').classList.add("active");


// ===== 開始ボタン =====

startBtn.addEventListener("click", startGame);

update();

// ===== 斬撃音 =====

function playSlashSound() {
  slashSound.currentTime = 0;
  slashSound.play();
}

