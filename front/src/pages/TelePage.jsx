import React from "react";
import "./TelePage.css";
import { useEffect, useRef } from "react";

function TelePage() {


    const previousWidth = useRef(window.innerWidth);
    const rows = 24;
    const columns = 40;
    const canvasHeight = useRef(rows * (window.innerHeight / 100));
    const canvasWidth = useRef(columns * (window.innerWidth / 100));
    const cellWidth = useRef(canvasWidth.current / columns);
    const cellHeight = useRef(canvasHeight.current / rows);

    if (window.innerWidth < 700) {
        canvasWidth.current = window.innerWidth * 0.95;
        canvasHeight.current = canvasWidth.current / columns * rows * 1.3;
        cellWidth.current = canvasWidth.current / columns;
        cellHeight.current = canvasHeight.current / rows;
    }

    function gridOperation(x, y, operation, value) {
        if (operation === "drawChar") {
            let canvas = document.querySelector(".teleCanvas");
            let ctx = canvas.getContext("2d");
            ctx.font = `${cellHeight.current}px monospace`;
            ctx.fillText(value, x * (cellWidth.current), (y + 1) * (cellHeight.current));
        }
    }

    //debug function for grid on canvas
    function drawCanvasGrid() {
        let canvas = document.querySelector(".teleCanvas");
        let ctx = canvas.getContext("2d");
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        for (let i = 0; i <= rows; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellHeight.current);
            ctx.lineTo(canvasWidth.current, i * cellHeight.current);
            ctx.stroke();
        }
        for (let i = 0; i <= columns; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellWidth.current, 0);
            ctx.lineTo(i * cellWidth.current, canvasHeight.current);
            ctx.stroke();
        }
    }

    useEffect(() => {
        gridOperation(5, 5, "drawChar", "A");
        drawCanvasGrid();
    }, []);
    
    function handleResize() {
        if (window.innerWidth < 700) {
            canvasWidth.current = window.innerWidth * 0.95;
            canvasHeight.current = canvasWidth.current / columns * rows * 1.3;
            cellWidth.current = canvasWidth.current / columns;
            cellHeight.current = canvasHeight.current / rows;
        } else {
            canvasHeight.current = rows * (window.innerHeight / 100);
            canvasWidth.current = columns * (window.innerWidth / 100);
            cellWidth.current = canvasWidth.current / columns;
            cellHeight.current = canvasHeight.current / rows;
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
                <canvas className="teleCanvas" width={canvasWidth.current} height={canvasHeight.current}></canvas>
            </div>
        </div>
    );
}

export default TelePage