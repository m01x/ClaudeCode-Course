const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PADDLE = { width: 100, height: 16, speed: 7 };
const BALL_RADIUS = 8;

const STARTING_LIVES = 3;
const BLOCK_SCORE_VALUE = 10;

const BLOCK_COLS = 10;
const BLOCK_WIDTH = 64;
const BLOCK_HEIGHT = 24;

const MAX_LEVEL = 10;

// Ancho de paddle: base hasta nivel 2, reducido desde nivel 3 en adelante
const PADDLE_WIDTH_BASE = 100;
const PADDLE_WIDTH_REDUCED = 70; // aplica desde level >= 3

// Velocidad de bola: crece 1px/frame por nivel, con tope
const BALL_BASE_SPEED = 5;
const BALL_SPEED_INCREMENT = 1; // por nivel
const BALL_MAX_SPEED = 12;

// Bloques: filas crecen con el nivel, tope en 8; columnas fijas en 10
const BLOCK_ROWS_BASE = 5;
const BLOCK_ROWS_MAX = 8;
const BLOCK_COLORS = [ 'gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ];

function speedForLevel( level ) {
  return Math.min( BALL_BASE_SPEED + BALL_SPEED_INCREMENT * ( level - 1 ), BALL_MAX_SPEED );
}

function rowsForLevel( level ) {
  return Math.min( BLOCK_ROWS_BASE + ( level - 1 ), BLOCK_ROWS_MAX );
}

function paddleWidthForLevel( level ) {
  return level >= 3 ? PADDLE_WIDTH_REDUCED : PADDLE_WIDTH_BASE;
}

const state = {
  screen: 'start', // 'start' | 'playing' | 'paused' | 'levelup' | 'gameover' | 'win'
  score: 0,
  lives: STARTING_LIVES,
  level: 1, // 1..MAX_LEVEL
  paddle: {
    x: ( CANVAS_WIDTH - PADDLE.width ) / 2,
    y: CANVAS_HEIGHT - 40,
    width: PADDLE.width,
    height: PADDLE.height,
  },
  ball: { x: 0, y: 0, dx: 0, dy: 0, radius: BALL_RADIUS, attached: true },
  blocks: [],
};

const explosions = [];

const BLOCK_GRID_OFFSET_X = ( CANVAS_WIDTH - BLOCK_COLS * BLOCK_WIDTH ) / 2;
const BLOCK_GRID_OFFSET_Y = 60;

function createBlocksForLevel( level ) {
  const blocks = [];
  const rows = rowsForLevel( level );

  for ( let row = 0; row < rows; row++ ) {
    const color = BLOCK_COLORS[ ( row + level - 1 ) % BLOCK_COLORS.length ];

    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      blocks.push( {
        x: BLOCK_GRID_OFFSET_X + col * BLOCK_WIDTH,
        y: BLOCK_GRID_OFFSET_Y + row * BLOCK_HEIGHT,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color,
        active: true,
      } );
    }
  }

  return blocks;
}

state.blocks = createBlocksForLevel( state.level );

const canvas = document.getElementById( 'game-canvas' );
const ctx = canvas.getContext( '2d' );

const logoImg = new Image();
let logoLoaded = false;
logoImg.onload = () => { logoLoaded = true; };
logoImg.src = 'assets/logo-m10xaloid.svg';

const ballBounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );
const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );

function playSound( sound ) {
  const instance = sound.cloneNode();
  instance.play().catch( () => {} );
}

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  KeyA: false,
  KeyD: false,
};

function resetGame() {
  state.score = 0;
  state.lives = STARTING_LIVES;
  state.level = 1;

  state.paddle.width = PADDLE_WIDTH_BASE;
  state.paddle.x = ( CANVAS_WIDTH - state.paddle.width ) / 2;
  state.paddle.y = CANVAS_HEIGHT - 40;

  state.ball.attached = true;
  state.ball.dx = 0;
  state.ball.dy = 0;

  state.blocks = createBlocksForLevel( state.level );
  explosions.length = 0;

  state.screen = 'start';
}

window.addEventListener( 'keydown', ( e ) => {
  if ( e.code === 'Space' ) {
    e.preventDefault();
    if ( state.screen === 'start' ) {
      state.screen = 'playing';
    } else if ( state.screen === 'playing' && state.ball.attached ) {
      state.ball.attached = false;
      state.ball.dx = 0;
      state.ball.dy = -speedForLevel( state.level );
    } else if ( state.screen === 'gameover' || state.screen === 'win' ) {
      resetGame();
    } else if ( state.screen === 'levelup' ) {
      state.level += 1;
      state.blocks = createBlocksForLevel( state.level );
      state.paddle.width = paddleWidthForLevel( state.level );
      state.paddle.x = Math.max( 0, Math.min( CANVAS_WIDTH - state.paddle.width, state.paddle.x ) );
      state.ball.attached = true;
      state.ball.dx = 0;
      state.ball.dy = 0;
      state.screen = 'playing';
    }
  }

  if ( e.code === 'KeyP' ) {
    if ( state.screen === 'playing' ) {
      state.screen = 'paused';
    } else if ( state.screen === 'paused' ) {
      state.screen = 'playing';
    }
  }

  if ( e.code in keys ) {
    keys[ e.code ] = true;
  }
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( e.code in keys ) {
    keys[ e.code ] = false;
  }
} );

function updatePaddle() {
  if ( keys.ArrowLeft || keys.KeyA ) {
    state.paddle.x -= PADDLE.speed;
  }
  if ( keys.ArrowRight || keys.KeyD ) {
    state.paddle.x += PADDLE.speed;
  }

  state.paddle.x = Math.max( 0, Math.min( CANVAS_WIDTH - state.paddle.width, state.paddle.x ) );
}

function updateBall() {
  const ball = state.ball;
  const paddle = state.paddle;

  if ( ball.attached ) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    return;
  }

  ball.x += ball.dx;
  ball.y += ball.dy;

  if ( ball.y - ball.radius > CANVAS_HEIGHT ) {
    state.lives -= 1;
    ball.attached = true;
    ball.dx = 0;
    ball.dy = 0;

    if ( state.lives <= 0 ) {
      state.screen = 'gameover';
    }

    return;
  }

  if ( ball.x - ball.radius <= 0 ) {
    ball.x = ball.radius;
    ball.dx = Math.abs( ball.dx );
    playSound( ballBounceSound );
  } else if ( ball.x + ball.radius >= CANVAS_WIDTH ) {
    ball.x = CANVAS_WIDTH - ball.radius;
    ball.dx = -Math.abs( ball.dx );
    playSound( ballBounceSound );
  }

  if ( ball.y - ball.radius <= 0 ) {
    ball.y = ball.radius;
    ball.dy = Math.abs( ball.dy );
    playSound( ballBounceSound );
  }

  const hitsPaddle =
    ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y + ball.radius <= paddle.y + paddle.height &&
    ball.x + ball.radius >= paddle.x &&
    ball.x - ball.radius <= paddle.x + paddle.width;

  if ( hitsPaddle ) {
    const hitPos = Math.max( 0, Math.min( 1, ( ball.x - paddle.x ) / paddle.width ) );
    const maxAngle = Math.PI / 3; // 60 degrees
    const angle = ( hitPos - 0.5 ) * 2 * maxAngle;

    const speed = speedForLevel( state.level );
    ball.dx = speed * Math.sin( angle );
    ball.dy = -speed * Math.cos( angle );
    ball.y = paddle.y - ball.radius;
    playSound( ballBounceSound );
  }
}

function updateBlockCollisions() {
  const ball = state.ball;

  for ( const block of state.blocks ) {
    if ( !block.active ) continue;

    const collides =
      ball.x + ball.radius > block.x &&
      ball.x - ball.radius < block.x + block.width &&
      ball.y + ball.radius > block.y &&
      ball.y - ball.radius < block.y + block.height;

    if ( !collides ) continue;

    const overlapX = Math.min(
      ball.x + ball.radius - block.x,
      block.x + block.width - ( ball.x - ball.radius )
    );
    const overlapY = Math.min(
      ball.y + ball.radius - block.y,
      block.y + block.height - ( ball.y - ball.radius )
    );

    if ( overlapX < overlapY ) {
      ball.dx = -ball.dx;
    } else {
      ball.dy = -ball.dy;
    }

    block.active = false;
    state.score += BLOCK_SCORE_VALUE;

    explosions.push( {
      x: block.x,
      y: block.y,
      color: block.color,
      frameIndex: 0,
      elapsedMs: 0,
    } );
    playSound( breakSound );

    if ( state.blocks.every( ( b ) => !b.active ) ) {
      state.screen = state.level < MAX_LEVEL ? 'levelup' : 'win';
    }

    break;
  }
}

function updateExplosions( dt ) {
  for ( let i = explosions.length - 1; i >= 0; i-- ) {
    const explosion = explosions[ i ];
    explosion.elapsedMs += dt;

    const totalFrames = EXPLOSION_FRAMES[ explosion.color ].length;

    if ( explosion.elapsedMs >= EXPLOSION_DURATION * totalFrames ) {
      explosions.splice( i, 1 );
      continue;
    }

    explosion.frameIndex = Math.min(
      totalFrames - 1,
      Math.floor( explosion.elapsedMs / EXPLOSION_DURATION )
    );
  }
}

function update( dt ) {
  if ( state.screen === 'playing' ) {
    updatePaddle();
    updateBall();
    updateBlockCollisions();
    updateExplosions( dt );
  }
}

function renderStartScreen() {
  if ( logoLoaded ) {
    const logoWidth = 480;
    const logoHeight = logoWidth * ( logoImg.height / logoImg.width );
    ctx.drawImage( logoImg, ( CANVAS_WIDTH - logoWidth ) / 2, 160, logoWidth, logoHeight );
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText( 'Presiona ESPACIO para iniciar', CANVAS_WIDTH / 2, 380 );
}

function renderPaddle() {
  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height );
}

function renderBall() {
  const ball = state.ball;
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );
}

function renderBlocks() {
  for ( const block of state.blocks ) {
    if ( !block.active ) continue;
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.width, block.height );
  }
}

function renderGameOverScreen() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText( 'GAME OVER', CANVAS_WIDTH / 2, 260 );

  ctx.font = '24px monospace';
  ctx.fillText( `Puntaje final: ${ state.score }`, CANVAS_WIDTH / 2, 320 );
  ctx.fillText( 'Presiona ESPACIO para reiniciar', CANVAS_WIDTH / 2, 380 );
}

function renderWinScreen() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText( '¡GANASTE!', CANVAS_WIDTH / 2, 260 );

  ctx.font = '24px monospace';
  ctx.fillText( `Puntaje final: ${ state.score }`, CANVAS_WIDTH / 2, 320 );
  ctx.fillText( 'Presiona ESPACIO para reiniciar', CANVAS_WIDTH / 2, 380 );
}

function renderHUD() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';

  ctx.textAlign = 'left';
  ctx.fillText( `Score: ${ state.score }`, 16, 28 );

  ctx.textAlign = 'center';
  ctx.fillText( `Nivel: ${ state.level }`, CANVAS_WIDTH / 2, 28 );

  ctx.textAlign = 'right';
  ctx.fillText( `Vidas: ${ state.lives }`, CANVAS_WIDTH - 16, 28 );
}

function renderExplosions() {
  for ( const explosion of explosions ) {
    const frame = EXPLOSION_FRAMES[ explosion.color ][ explosion.frameIndex ];
    drawFrame( ctx, frame, explosion.x, explosion.y, BLOCK_WIDTH, BLOCK_HEIGHT );
  }
}

function renderPlayingScene() {
  renderBlocks();
  renderExplosions();
  renderPaddle();
  renderBall();
  renderHUD();
}

function renderPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  ctx.fillStyle = '#ffffff';
  ctx.font = '48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText( 'PAUSADO', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 );
}

function renderLevelUpOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  ctx.fillStyle = '#ffffff';
  ctx.font = '32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText( `Nivel ${ state.level } completado`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20 );

  ctx.font = '24px monospace';
  ctx.fillText( 'Presiona ESPACIO para continuar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20 );
}

function render() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  if ( state.screen === 'start' ) {
    renderStartScreen();
  } else if ( state.screen === 'playing' ) {
    renderPlayingScene();
  } else if ( state.screen === 'paused' ) {
    renderPlayingScene();
    renderPauseOverlay();
  } else if ( state.screen === 'levelup' ) {
    renderPlayingScene();
    renderLevelUpOverlay();
  } else if ( state.screen === 'gameover' ) {
    renderGameOverScreen();
  } else if ( state.screen === 'win' ) {
    renderWinScreen();
  }
}

let lastTimestamp = 0;

function loop( timestamp ) {
  const dt = lastTimestamp ? timestamp - lastTimestamp : 0;
  lastTimestamp = timestamp;

  update( dt );
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );
