import React from "react";
import "./TelePage.css";
import { useEffect, useRef } from "react";
import axios from 'axios';
import apiAdress from "../components/apiAdress.js";
import { io } from "socket.io-client";

function TelePage() {
    const previousWidth = useRef(window.innerWidth);
    const rows = 24;
    const columns = 40;
    const canvasHeight = useRef(rows * (window.innerHeight / 100) * 2);
    const canvasWidth = useRef(columns * (window.innerWidth / 100));
    const cellWidth = useRef(canvasWidth.current / columns);
    const cellHeight = useRef(canvasHeight.current / rows);
    const cellsArray = useRef(Array.from({ length: columns }, () => Array.from({ length: rows }, () => ({ char: "", bg: "" }))));
    const currentPage = useRef(100);

    useEffect(() => {
        const socket = io(apiAdress);

        function connectToRoom() {
            socket.emit('joinRoom', currentPage.current);
        }

        connectToRoom();

        return () => {
            socket.disconnect();
        };
    }, []);


    useEffect(() => {
        axios.get(`${apiAdress}/page/${currentPage.current}`)
            .then(response => {
                gridOperation(0, 24, "setFont", "VT323");
                const cells = response.data.cells;
                cells.forEach(cell => {
                    if (cell.bg != "" && cell.bg != null) {
                        gridOperation(cell.x, cell.y, "drawBg", cell.bg);
                    }
                    if (cell.char != "" && cell.char != null) {
                        gridOperation(cell.x, cell.y, "drawChar", cell.char, cell.charColor);
                    }
                    cellsArray.current[cell.x][cell.y] = {
                        char: cell.char,
                        bg: cell.bg,
                        charColor: cell.charColor
                    };
                });
            });
    }, [currentPage.current]);

    if (window.innerWidth < 700) {
        canvasWidth.current = window.innerWidth * 0.95;
        canvasHeight.current = canvasWidth.current / columns * rows * 1.3;
        cellWidth.current = canvasWidth.current / columns;
        cellHeight.current = canvasHeight.current / rows;
    }

    function gridOperation(x, y, operation, value, value2) {
        let canvas = document.querySelector(".teleCanvas");
        let ctx = canvas.getContext("2d");
        if (operation === "drawChar") {;
            if (value2 === undefined || value2 === null || value2 === "") {
                value2 = "white"; // Default color
            }
            ctx.fillStyle = value2;
            ctx.fillText(value, x * (cellWidth.current), (y + 1) * (cellHeight.current));
        }
        if (operation === "clearCell") {
            ctx.clearRect(x * (cellWidth.current), y * (cellHeight.current), cellWidth.current, cellHeight.current);
        }
        if (operation === "drawBg") {
            ctx.fillStyle = value;
            ctx.fillRect(x * (cellWidth.current), y * (cellHeight.current), cellWidth.current, cellHeight.current);
            if (cellsArray.current[x][y].char !== "") {
                gridOperation(x, y, "drawChar", cellsArray.current[x][y].char, cellsArray.current[x][y].charColor);
            }
        }
        if (operation === "setFont") {
            ctx.font = `${cellHeight.current * 1.2}px ${value}`;
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
        drawCanvasGrid();
    }, []);

    function clearCanvas() {
        let ctx = document.querySelector(".teleCanvas").getContext("2d");
        ctx.clearRect(0, 0, canvasWidth.current, canvasHeight.current);
    }

    useEffect(() => {
        clearCanvas();
        drawCanvasGrid();
        
        /* cellsArray.current[0][23].char = "A";
        cellsArray.current[0][23].bg = "blue";
        cellsArray.current[0][23].charColor = "white";
        cellsArray.current[1][23].char = "B";
        cellsArray.current[1][23].bg = "red";
        cellsArray.current[1][23].charColor = "yellow";
        
        gridOperation(0, 23, "drawChar", "A", "white");
        gridOperation(0, 23, "drawBg", "blue");
        gridOperation(1, 23, "drawChar", "B", "yellow");
        gridOperation(1, 23, "drawBg", "red"); */
    }, [canvasWidth.current, canvasHeight.current]);
    
    function handleResize() {
        if (window.innerWidth < 700) {
            canvasWidth.current = window.innerWidth * 0.95;
            canvasHeight.current = canvasWidth.current / columns * rows * 1.3;
            cellWidth.current = canvasWidth.current / columns;
            cellHeight.current = canvasHeight.current / rows;
        } else {
            canvasHeight.current = rows * (window.innerHeight / 100) * 2;
            canvasWidth.current = columns * (window.innerWidth / 100);
            cellWidth.current = canvasWidth.current / columns;
            cellHeight.current = canvasHeight.current / rows;
        }
    }

    useEffect(() => {
        let timer = 0;
        let interval = setInterval(() => {
            timer += 50;
            if (timer >= 50 && previousWidth.current !== window.innerWidth) {
                timer = 0;
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