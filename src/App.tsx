import React, { useRef, useEffect, useState } from "react";
import "./App.css";

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 8;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Paddle state
  const [playerY, setPlayerY] = useState(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [computerY, setComputerY] = useState(
    CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
  );
  // Paddle control
  const upPressed = useRef(false);
  const downPressed = useRef(false);
  const mouseY = useRef(playerY + PADDLE_HEIGHT / 2);

  // Score state
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);

  // Ball state
  const ball = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 5 * (Math.random() > 0.5 ? 1 : -1),
    vy: 4 * (Math.random() > 0.5 ? 1 : -1),
  });

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;

    const drawRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };

    const drawCircle = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    };

    const resetBall = (dir: number) => {
      ball.current.x = CANVAS_WIDTH / 2;
      ball.current.y = CANVAS_HEIGHT / 2;
      ball.current.vx = dir * (4 + Math.random() * 2);
      ball.current.vy = (Math.random() - 0.5) * 8;
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      // Clear
      drawRect(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, "#000");

      // Paddles
      drawRect(ctx, 0, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, "#fff");
      drawRect(
        ctx,
        CANVAS_WIDTH - PADDLE_WIDTH,
        computerY,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
        "#fff"
      );

      // Ball
      drawCircle(ctx, ball.current.x, ball.current.y, BALL_RADIUS, "#fff");

      // Midline
      for (let i = 10; i < CANVAS_HEIGHT; i += 30) {
        drawRect(
          ctx,
          CANVAS_WIDTH / 2 - 2,
          i,
          4,
          15,
          "#888"
        );
      }
    };

    const update = () => {
      // Move player paddle
      let newPlayerY = playerY;
      if (upPressed.current) newPlayerY -= 7;
      if (downPressed.current) newPlayerY += 7;
      // Mouse control takes priority if arrow keys are not pressed
      if (!upPressed.current && !downPressed.current) {
        newPlayerY +=
          (mouseY.current - (newPlayerY + PADDLE_HEIGHT / 2)) * 0.1;
      }
      newPlayerY = clamp(newPlayerY, 0, CANVAS_HEIGHT - PADDLE_HEIGHT);
      setPlayerY(newPlayerY);

      // Move computer paddle (simple AI)
      let compCenter = computerY + PADDLE_HEIGHT / 2;
      let newComputerY = computerY;
      if (compCenter < ball.current.y - 10) newComputerY += 5;
      else if (compCenter > ball.current.y + 10) newComputerY -= 5;
      newComputerY = clamp(newComputerY, 0, CANVAS_HEIGHT - PADDLE_HEIGHT);
      setComputerY(newComputerY);

      // Move ball
      ball.current.x += ball.current.vx;
      ball.current.y += ball.current.vy;

      // Collisions: Top/Bottom walls
      if (
        ball.current.y - BALL_RADIUS < 0 ||
        ball.current.y + BALL_RADIUS > CANVAS_HEIGHT
      ) {
        ball.current.vy = -ball.current.vy;
      }

      // Collisions: Player paddle
      if (
        ball.current.x - BALL_RADIUS < PADDLE_WIDTH &&
        ball.current.y > newPlayerY &&
        ball.current.y < newPlayerY + PADDLE_HEIGHT
      ) {
        ball.current.vx = -ball.current.vx;
        // "Spin" based on hit position
        let hitPos =
          (ball.current.y - (newPlayerY + PADDLE_HEIGHT / 2)) /
          (PADDLE_HEIGHT / 2);
        ball.current.vy = 5 * hitPos;
        ball.current.x = PADDLE_WIDTH + BALL_RADIUS;
      }

      // Collisions: Computer paddle
      if (
        ball.current.x + BALL_RADIUS > CANVAS_WIDTH - PADDLE_WIDTH &&
        ball.current.y > newComputerY &&
        ball.current.y < newComputerY + PADDLE_HEIGHT
      ) {
        ball.current.vx = -ball.current.vx;
        let hitPos =
          (ball.current.y - (newComputerY + PADDLE_HEIGHT / 2)) /
          (PADDLE_HEIGHT / 2);
        ball.current.vy = 5 * hitPos;
        ball.current.x = CANVAS_WIDTH - PADDLE_WIDTH - BALL_RADIUS;
      }

      // Score
      if (ball.current.x < 0) {
        setComputerScore((score) => score + 1);
        resetBall(-1);
      }
      if (ball.current.x > CANVAS_WIDTH) {
        setPlayerScore((score) => score + 1);
        resetBall(1);
      }
    };

    const render = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        update();
        draw(ctx);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerY, computerY]);

  // Mouse control
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        mouseY.current = e.clientY - rect.top;
      }
    };
    const canvas = canvasRef.current;
    canvas?.addEventListener("mousemove", handleMouseMove);
    return () => {
      canvas?.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Keyboard control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") upPressed.current = true;
      if (e.key === "ArrowDown") downPressed.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") upPressed.current = false;
      if (e.key === "ArrowDown") downPressed.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="App">
      <h1>Simple Pong Game</h1>
      <div id="scoreboard">
        <span id="player-score">{playerScore}</span> :{" "}
        <span id="computer-score">{computerScore}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        id="pong"
        tabIndex={0}
        style={{ outline: "none" }}
      />
      <div className="instructions">
        <p>
          Use your <b>mouse</b> or <b>arrow keys</b> to move the left paddle.<br />
          Try to beat the computer!
        </p>
      </div>
    </div>
  );
}

export default App;