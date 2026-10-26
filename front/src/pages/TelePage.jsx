import React from "react";
import "./TelePage.css";
import { useEffect, useRef } from "react";

function TelePage() {


    const previousWidth = useRef(window.innerWidth);
    const rows = 24;
    const columns = 40;
    let canvasHeight = rows * (window.innerHeight / 100);
    let canvasWidth = columns * (window.innerWidth / 100);

    if (window.innerWidth < 700) {
        canvasWidth = window.innerWidth * 0.95;
        canvasHeight = canvasWidth / columns * rows * 1.3;
    }

    function gridOperation(x, y, operation, value) {
        if (operation === "drawChar") {
            let canvas = document.querySelector(".teleCanvas");
            let ctx = canvas.getContext("2d");
            ctx.font = `${canvasHeight / rows}px monospace`;
            ctx.fillText(value, x * (canvasWidth / columns), (y + 1) * (canvasHeight / rows));
        }
    }

    //debug function for grid on canvas
    function drawCanvasGrid() {
        let canvas = document.querySelector(".teleCanvas");
        let ctx = canvas.getContext("2d");
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        for (let i = 0; i < canvas.width; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 16) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
    }

    useEffect(() => {
        gridOperation(5, 5, "drawChar", "A");
        drawCanvasGrid();
    }, []);
    
    function handleResize() {
        if (window.innerWidth < 700) {
            canvasWidth = window.innerWidth * 0.95;
            canvasHeight = canvasWidth / columns * rows * 1.3;
        } else {
            canvasHeight = rows * (window.innerHeight / 100);
            canvasWidth = columns * (window.innerWidth / 100);
        }
    }

    useEffect(() => {
        let timer = 0;
        let interval = setInterval(() => {
            timer += 50;
            if (timer >= 200 && previousWidth.current !== window.innerWidth) {
                console.log("resized")
                previousWidth.current = window.innerWidth;
                handleResize();
            }
        }, 50);

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="telePageMain">
            <div className="canvasDiv">
                <canvas className="teleCanvas" width={canvasWidth} height={canvasHeight}></canvas>
            </div>
        </div>
    );
}

export default TelePage