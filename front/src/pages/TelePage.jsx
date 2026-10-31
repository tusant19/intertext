import React from "react";
import "./TelePage.css";
import { useEffect, useRef } from "react";
import axios from 'axios';
import apiAdress from "../components/apiAdress.js";
import { io } from "socket.io-client";
import '@fontsource/vt323';
import { useState } from "react";

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
    const [coins, setCoins] = useState(0);
    const movingHighlightRef = useRef(null);
    const canvasRef = useRef(null);
    const clickedCell = useRef({ x: null, y: null });
    const textToolActive = useRef(false);
    const charColorToolActive = useRef(false);
    const bgToolActive = useRef(false);
    const textToolRef = useRef(null);
    const coinsRef = useRef(0);
    const clearToolRef = useRef(null);
    const clearToolActive = useRef(false);

    useEffect(() => {
        const socket = io(apiAdress);

        function connectToRoom() {
            socket.emit('joinRoom', "100");
        }

        socket.on('cellCharUpdate', (x, y, char, charColor) => {
            gridOperation(x, y, "removeChar");
            console.log(`Received cell update: ${char} at (${x}, ${y}) with color ${charColor}`);
            gridOperation(x, y, "drawChar", char, charColor);
            cellsArray.current[x][y] = {
                ...cellsArray.current[x][y],
                char: char,
                charColor: charColor
            };
        });

        socket.on('cellClear', (x, y) => {
            console.log(`Received cell clear at (${x}, ${y})`);
            gridOperation(x, y, "removeChar");
            cellsArray.current[x][y] = {
                ...cellsArray.current[x][y],
                char: "",
                charColor: "black"
            };
        });

        connectToRoom();

        return () => {
            socket.disconnect();
        };
    }, []);



    useEffect(() => {
        axios.get(`${apiAdress}/page/${currentPage.current}`)
            .then(response => {
                const cells = response.data.cells;
                cells.forEach(async (cell) => {
                    if (cell.font != "" && cell.font != null) {
                        await gridOperation(cell.x, cell.y, "setFont", cell.font);
                    }
                    if (cell.bg != "" && cell.bg != null) {
                        await gridOperation(cell.x, cell.y, "drawBg", cell.bg);
                    }
                    if (cell.char != "" && cell.char != null) {
                        await gridOperation(cell.x, cell.y, "drawChar", cell.char, cell.charColor);
                    }
                    cellsArray.current[cell.x][cell.y] = {
                        font: cell.font,
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

    async function gridOperation(x, y, operation, value, value2) {
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
            console.log("setting font to " + value);
            await document.fonts.load(`${cellHeight.current * 1.2}px ${value}`);
            ctx.font = `${cellHeight.current * 1.2}px ${value}`;
        }
        if (operation === "removeChar") {
            cellsArray.current[x][y].char = "";
            ctx.clearRect(x * (cellWidth.current), y * (cellHeight.current), cellWidth.current, cellHeight.current);
            if (cellsArray.current[x][y].bg !== "") {
                gridOperation(x, y, "drawBg", cellsArray.current[x][y].bg);
            }
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
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasWidth.current, canvasHeight.current);
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

    useEffect(() => {
        let interval = setInterval(() => {
            coinsRef.current = coinsRef.current + 1;
            console.log("coinsRef: " + coinsRef.current);
            setCoins(prevCoins => {
                if (prevCoins < 500) {
                    
                    return prevCoins + 1;
                }
                return prevCoins;
            });
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, []);
            

    //listen for click on canvas and get cell coordinates
    useEffect(() => {
        const canvas = document.querySelector(".teleCanvas");
        function handleClick(event) {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / cellWidth.current);
            const y = Math.floor((event.clientY - rect.top) / cellHeight.current);
            
            clickedCell.current = { x, y };
            console.log(`Clicked cell: ${clickedCell.current.x}, ${clickedCell.current.y}`);
            highlightCell(x, y);
        }
        canvas.addEventListener("click", handleClick);

        return () => {
            canvas.removeEventListener("click", handleClick);
        };
    }, []);

    // add a bloom effect around cell
    function highlightCell(x, y) {
        //move the highlight div to the cell coordinates
        movingHighlightRef.current.style.left = `${canvasRef.current.offsetLeft + x * cellWidth.current}px`;
        movingHighlightRef.current.style.top = `${canvasRef.current.offsetTop + y * cellHeight.current}px`;
        movingHighlightRef.current.style.width = `${cellWidth.current}px`;
        movingHighlightRef.current.style.height = `${cellHeight.current}px`;
        movingHighlightRef.current.style.display = "block";
        //wait, clear the highlight
        setTimeout(() => {
            movingHighlightRef.current.style.display = "none";
        }, 5000);
    }

    function fakeClickCell(x, y) {
        clickedCell.current = { x, y };
        console.log(`Fake clicked cell: ${clickedCell.current.x}, ${clickedCell.current.y}`);
        highlightCell(x, y);
    }

    // monitor for key press if text tool is active
    useEffect(() => {
        function handleKeyPress(event) {
            if (textToolActive.current && clickedCell.current.x !== null && clickedCell.current.y !== null) {
                if (coinsRef.current < 1) {
                    console.log("Not enough coins to type");
                    return;
                } else {
                    const char = event.key;
                    console.log(`Key pressed: ${char} at cell: ${clickedCell.current.x}, ${clickedCell.current.y}`);

                    //send to server
                    axios.put(`${apiAdress}/page/${currentPage.current}/cellchar`, {
                        x: clickedCell.current.x,
                        y: clickedCell.current.y,
                        char: char,
                        charColor: "black"
                    });
                    coinsRef.current = coinsRef.current - 1;

                    setCoins(prevCoins => {
                        if (prevCoins > 0) {
                            return prevCoins - 1;
                        } else {
                            return prevCoins;
                        }
                    });

                    if (clickedCell.current.x < columns - 1) {
                        fakeClickCell(clickedCell.current.x + 1, clickedCell.current.y);
                    } else if (clickedCell.current.y < rows - 1) {
                        fakeClickCell(0, clickedCell.current.y + 1);
                    }
                }
            }
        }

        window.addEventListener("keydown", handleKeyPress);
    }, []);

    //handle key press for clear tool
    useEffect(() => {
        function handleClearKeyPress(event) {
            if (clearToolActive.current && clickedCell.current.x !== null && clickedCell.current.y !== null) {
                if (coinsRef.current < 1) {
                    console.log("Not enough coins to clear");
                    return;
                } else {
                    axios.put(`${apiAdress}/page/${currentPage.current}/cellclear`, {
                        x: clickedCell.current.x,
                        y: clickedCell.current.y
                    });
                    coinsRef.current = coinsRef.current - 1;
                    setCoins(prevCoins => {
                        if (prevCoins > 0) {
                            return prevCoins - 1;
                        } else {
                            return prevCoins;
                        }
                    });

                    if (clickedCell.current.x < columns - 1) {
                        fakeClickCell(clickedCell.current.x + 1, clickedCell.current.y);
                    } else if (clickedCell.current.y < rows - 1) {
                        fakeClickCell(0, clickedCell.current.y + 1);
                    }
                }
            }
        }

        window.addEventListener("keydown", handleClearKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, []);

    function toggleTextTool() {
        if (isAnyToolActive() && !textToolActive.current) {
            console.log("Another tool is active, cannot activate text tool");
            return;
        }
        textToolActive.current = !textToolActive.current;
        if (textToolActive.current) {
            textToolRef.current.style.backgroundColor = "lightblue";
        } else {
            textToolRef.current.style.backgroundColor = "lightgray";
        }
    }

    function toggleClearTool() {
        if (isAnyToolActive() && !clearToolActive.current) {
            console.log("Another tool is active, cannot activate clear tool");
            return;
        }
        if (clearToolRef.current.style.backgroundColor === "lightgray" || clearToolRef.current.style.backgroundColor === "") {
            clearToolRef.current.style.backgroundColor = "lightblue";
            clearToolActive.current = true;
        } else {
            clearToolRef.current.style.backgroundColor = "lightgray";
            clearToolActive.current = false;
        }
    }

    function isAnyToolActive() {
        return textToolActive.current || charColorToolActive.current || bgToolActive.current || clearToolActive.current;
    }


    return (
        <div className="telePageMain">
            <div className="movingHighlightDiv" ref={movingHighlightRef}></div>
            <div className="toolBarDiv">
                <div className="coinsDisplay">
                    <p>Insert image here {coins}</p>
                </div>
                <div className="toolDiv">
                    <div className="textWriteToolDiv">
                        <button className="toolButton" ref={textToolRef} onClick={toggleTextTool}>Text</button>
                    </div>
                    <div className="clearToolDiv">
                        <button className="toolButton" ref={clearToolRef} onClick={toggleClearTool}>Clear</button>
                    </div>
                    <div className="charColorToolDiv">
                        <button className="toolButton">Character Color</button>
                    </div>
                    <div className="bgToolDiv">
                        <button className="toolButton">Background</button>
                    </div>
                </div>
            </div>
            <div className="canvasDiv">
                <canvas className="teleCanvas" width={canvasWidth.current} height={canvasHeight.current} ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

export default TelePage;