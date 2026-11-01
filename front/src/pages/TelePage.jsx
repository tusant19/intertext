import React from "react";
import "./TelePage.css";
import { useEffect, useRef } from "react";
import axios from 'axios';
import apiAdress from "../components/apiAdress.js";
import { io } from "socket.io-client";
import '@fontsource/vt323';
import { useState } from "react";
import coinImage from "../assets/coin.png";
import tvLeftImage from "../assets/tvleft.png";
import tvMiddleImage from "../assets/tvmiddle.png";
import tvRightImage from "../assets/tvright.png";

const mobileKeyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

function TelePage() {
    const rows = 24;
    const columns = 40;
    const canvasWidth = useRef(columns * (window.innerWidth / 100));
    const canvasHeight = useRef(Math.min(rows * (window.innerHeight / 100) * 2, canvasWidth.current * 2790 / 1500, (window.innerWidth * 0.95 - canvasWidth.current) * 2790 / 1620));
    const cellWidth = useRef(canvasWidth.current / columns);
    const cellHeight = useRef(canvasHeight.current / rows);
    const cellsArray = useRef(Array.from({ length: columns }, () => Array.from({ length: rows }, () => ({ char: "", bg: "" }))));
    const currentPage = useRef(1);
    const [coins, setCoins] = useState(0);
    const [canvasSizeVersion, setCanvasSizeVersion] = useState(0);
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
    const charColorToolRef = useRef(null);
    const bgToolRef = useRef(null);
    const currentCharColor = useRef("#ffffff");
    const currentBgColor = useRef("#0000ff");
    const [errorMessage, setErrorMessage] = useState("");
    const [mobileKeyboardOpen, setMobileKeyboardOpen] = useState(false);

    useEffect(() => {
        const socket = io(apiAdress);

        function connectToRoom() {
            socket.emit('joinRoom', String(currentPage.current));
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

        socket.on('cellCharColorUpdate', (x, y, charColor) => {
            console.log(`Received cell char color update at (${x}, ${y}) with color ${charColor}`);
            gridOperation(x, y, "drawChar", cellsArray.current[x][y].char, charColor);
            cellsArray.current[x][y] = {
                ...cellsArray.current[x][y],
                charColor: charColor
            };
        });

        socket.on('cellBgColorUpdate', (x, y, bgColor) => {
            console.log(`Received cell bg color update at (${x}, ${y}) with color ${bgColor}`);
            cellsArray.current[x][y] = {
                ...cellsArray.current[x][y],
                bg: bgColor
            };
            gridOperation(x, y, "drawBg", bgColor);
            if (cellsArray.current[x][y].char) {
                gridOperation(x, y, "drawChar", cellsArray.current[x][y].char, cellsArray.current[x][y].charColor);
            }
        });

        socket.on('connect', connectToRoom);

        //listen for page number inputchange and rejoin room
        const pageInput = document.getElementById("pageNumberInput");
        const joinSelectedPage = () => {
            //if input less than 1 or greater than 100000 or empty ignore
            if (pageInput.value < 1 || pageInput.value > 100000 || pageInput.value === "") {
                return;
            }
            //rejoin room
            socket.emit('joinRoom', String(Number(pageInput.value)));
        };
        pageInput.addEventListener("input", joinSelectedPage);
        pageInput.addEventListener("change", joinSelectedPage);

        //also listen for number presses when input is focused
        pageInput.addEventListener("keydown", (event) => {
            if (event.key === "1" || event.key === "2" || event.key === "3" || event.key === "4" || event.key === "5" || event.key === "6" || event.key === "7" || event.key === "8" || event.key === "9" || event.key === "0") {
                //if input less than 1 or greater than 100000 or empty ignore
                if (pageInput.value < 1 || pageInput.value > 100000 || pageInput.value === "") {
                    return;
                }
                //rejoin room
                socket.emit('joinRoom', currentPage.current + event.key);
            }
        });

        return () => {
            pageInput.removeEventListener("input", joinSelectedPage);
            pageInput.removeEventListener("change", joinSelectedPage);
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
        }
        if (operation === "setFont") {
            console.log("setting font to " + value);
            await document.fonts.load(`${cellHeight.current * 1.2}px ${value}`);
            ctx.font = `${cellHeight.current * 1.2}px ${value}`;
        }
        if (operation === "removeChar") {
            cellsArray.current[x][y].char = "";
            ctx.clearRect(x * (cellWidth.current), y * (cellHeight.current), cellWidth.current, cellHeight.current);
            if (cellsArray.current[x][y].bg) {
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

    function clearCanvas() {
        let ctx = document.querySelector(".teleCanvas").getContext("2d");
        ctx.clearRect(0, 0, canvasWidth.current, canvasHeight.current);
    }

    useEffect(() => {
        let cancelled = false;
        clearCanvas();
        cellsArray.current.forEach((column, x) => column.forEach((cell, y) => {
            if (cell.bg && cell.bg !== "transparent") gridOperation(x, y, "drawBg", cell.bg);
        }));
        (async () => {
            let font = "";
            for (let x = 0; x < columns; x++) for (let y = 0; y < rows; y++) {
                const cell = cellsArray.current[x][y];
                if (cell.font && cell.font !== font) {
                    await gridOperation(x, y, "setFont", cell.font);
                    if (cancelled) return;
                    font = cell.font;
                }
                if (cell.char) gridOperation(x, y, "drawChar", cell.char, cell.charColor);
            }
        })();
        return () => { cancelled = true; };
        
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
    }, [canvasSizeVersion]);
    
    function handleResize() {
        if (window.innerWidth < 700) {
            canvasWidth.current = window.innerWidth * 0.95;
            canvasHeight.current = canvasWidth.current / columns * rows * 1.3;
            cellWidth.current = canvasWidth.current / columns;
            cellHeight.current = canvasHeight.current / rows;
        } else {
            canvasWidth.current = columns * (window.innerWidth / 100);
            canvasHeight.current = Math.min(rows * (window.innerHeight / 100) * 2, canvasWidth.current * 2790 / 1500, (window.innerWidth * 0.95 - canvasWidth.current) * 2790 / 1620);
            cellWidth.current = canvasWidth.current / columns;
            cellHeight.current = canvasHeight.current / rows;
        }
    }

    useEffect(() => {
        let timer;
        const resize = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                handleResize();
                setCanvasSizeVersion(version => version + 1);
            }, 150);
        };
        window.addEventListener("resize", resize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", resize);
        };
    }, []);

    useEffect(() => {
        let interval = setInterval(() => {
            coinsRef.current = coinsRef.current + 1;
            setCoins(prevCoins => {
                if (prevCoins < 500) {
                    
                    return prevCoins + 1;
                }
                return prevCoins;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);
            

    //listen for click on canvas and get cell coordinates
    useEffect(() => {
        const canvas = document.querySelector(".teleCanvas");
        function handleClick(event) {
            const rect = canvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(columns - 1, Math.floor((event.clientX - rect.left) / cellWidth.current)));
            const y = Math.max(0, Math.min(rows - 1, Math.floor((event.clientY - rect.top) / cellHeight.current)));
            
            clickedCell.current = { x, y };
            console.log(`Clicked cell: ${clickedCell.current.x}, ${clickedCell.current.y}`);
            highlightCell(x, y);
        }
        canvas.addEventListener("pointerdown", handleClick);

        return () => {
            canvas.removeEventListener("pointerdown", handleClick);
        };
    }, []);

    // add a bloom effect around cell
    function highlightCell(x, y) {
        //move the highlight div to the cell coordinates
        const rect = canvasRef.current.getBoundingClientRect();
        movingHighlightRef.current.style.left = `${rect.left + window.scrollX + x * cellWidth.current}px`;
        movingHighlightRef.current.style.top = `${rect.top + window.scrollY + y * cellHeight.current}px`;
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
            let isChanginBgColor = false;
            if (event.key.length !== 1 || event.target?.id === "pageNumberInput") {
                return;
            }
            //if page 1 err
            if (currentPage.current === 1) {
                setErrMsg("Cannot edit page 1");
                console.log("Cannot edit page 1");
                return;
            }
            if (textToolActive.current && clickedCell.current.x !== null && clickedCell.current.y !== null) {
                if (coinsRef.current < 1) {
                    setErrMsg("Not enough coins to type");
                    return;
                } else {
                    const char = event.key;
                    console.log(`Key pressed: ${char} at cell: ${clickedCell.current.x}, ${clickedCell.current.y}`);

                    //if charcolor not the same take additional coin
                    if (currentCharColor.current !== cellsArray.current[clickedCell.current.x][clickedCell.current.y].charColor) {
                        if (coinsRef.current < 2) {
                            setErrMsg("Not enough coins to change character color");
                            return;
                        } else {
                            isChanginBgColor = true;
                            coinsRef.current = coinsRef.current - 1;
                            setCoins(prevCoins => {
                                if (prevCoins > 0) {
                                    return prevCoins - 1;
                                } else {
                                    return prevCoins;
                                }
                            });
                        }
                    }

                    //send to server
                    axios.put(`${apiAdress}/page/${currentPage.current}/cellchar`, {
                        x: clickedCell.current.x,
                        y: clickedCell.current.y,
                        char: char,
                        charColor: currentCharColor.current,
                        ...(isChanginBgColor && { bgColor: currentBgColor.current })
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
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, []);

    //handle key press for clear tool
    useEffect(() => {
        function handleClearKeyPress(event) {
            //if page 1 err
            if (currentPage.current === 1) {
                setErrMsg("Cannot edit page 1");
                console.log("Cannot edit page 1");
                return;
            }
            //if key not backspace or delete
            if (event.key !== "Backspace" && event.key !== "Delete") {
                return;
            }
            if (clearToolActive.current && clickedCell.current.x !== null && clickedCell.current.y !== null) {
                if (coinsRef.current < 1) {
                    setErrMsg("Not enough coins to clear");
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
            window.removeEventListener("keydown", handleClearKeyPress);
        };
    }, []);

    //handle key press for char color tool
    useEffect(() => {
        function handleCharColorKeyPress(event) {
            //if page 1 err
            if (currentPage.current === 1) {
                setErrMsg("Cannot edit page 1");
                console.log("Cannot edit page 1");
                return;
            }
            //if key not enter
            if (event.key !== "Enter") {
                return;
            }
            if (charColorToolActive.current && clickedCell.current.x !== null && clickedCell.current.y !== null) {
                if (coinsRef.current < 1) {
                    setErrMsg("Not enough coins to change character color");
                    return;
                } else {
                    const charColor = document.getElementById("charColorPicker").value;
                    console.log(`Changing character color to: ${charColor} at cell: ${clickedCell.current.x}, ${clickedCell.current.y}`);
                    currentCharColor.current = charColor;
                    axios.put(`${apiAdress}/page/${currentPage.current}/cellcharcolor`, {
                        x: clickedCell.current.x,
                        y: clickedCell.current.y,
                        charColor: charColor
                    });
                }
            }
        }

        window.addEventListener("keydown", handleCharColorKeyPress);

        return () => {
            window.removeEventListener("keydown", handleCharColorKeyPress);
        };
    }, []);

    //handle key press for bg color tool
    useEffect(() => {
        function handleBgColorKeyPress(event) {
            //if page 1 err
            if (currentPage.current === 1) {
                setErrMsg("Cannot edit page 1");
                console.log("Cannot edit page 1");
                return;
            }
            //if key not enter
            if (event.key !== "Enter") {
                return;
            }
            if (bgToolActive.current && clickedCell.current.x !== null && clickedCell.current.y !== null) {
                if (coinsRef.current < 1) {
                    setErrMsg("Not enough coins to change background color");
                    return;
                } else {
                    const bgColor = document.getElementById("bgColorPicker").value;
                    console.log(`Changing background color to: ${bgColor} at cell: ${clickedCell.current.x}, ${clickedCell.current.y}`);
                    axios.put(`${apiAdress}/page/${currentPage.current}/cellbgcolor`, {
                        x: clickedCell.current.x,
                        y: clickedCell.current.y,
                        bgColor: bgColor
                    });
                }
            }
        }

        window.addEventListener("keydown", handleBgColorKeyPress);

        return () => {
            window.removeEventListener("keydown", handleBgColorKeyPress);
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
            textToolRef.current.style.backgroundColor = "#f0f0f0";
        }
    }

    function toggleClearTool() {
        if (isAnyToolActive() && !clearToolActive.current) {
            console.log("Another tool is active, cannot activate clear tool");
            return;
        }
        clearToolActive.current = !clearToolActive.current;
        if (clearToolActive.current) {
            clearToolRef.current.style.backgroundColor = "lightblue";
        } else {
            clearToolRef.current.style.backgroundColor = "#f0f0f0";
        }
    }

    function toggleCharColorTool() {
        if (isAnyToolActive() && !charColorToolActive.current) {
            console.log("Another tool is active, cannot activate char color tool");
            return;
        }
        charColorToolActive.current = !charColorToolActive.current;
        if (charColorToolActive.current) {
            charColorToolRef.current.style.backgroundColor = "lightblue";
        } else {
            charColorToolRef.current.style.backgroundColor = "#f0f0f0";
        }
    }

    function toggleBgTool() {
        if (isAnyToolActive() && !bgToolActive.current) {
            console.log("Another tool is active, cannot activate bg tool");
            return;
        }
        bgToolActive.current = !bgToolActive.current;
        if (bgToolActive.current) {
            bgToolRef.current.style.backgroundColor = "lightblue";
        } else {
            bgToolRef.current.style.backgroundColor = "#f0f0f0";
        }
    }

    function isAnyToolActive() {
        return textToolActive.current || charColorToolActive.current || bgToolActive.current || clearToolActive.current;
    }
    
    async function deactivateAllTools() {
        textToolActive.current = false;
        charColorToolActive.current = false;
        bgToolActive.current = false;
        clearToolActive.current = false;
        textToolRef.current.style.backgroundColor = "#f0f0f0";
        clearToolRef.current.style.backgroundColor = "#f0f0f0";
        charColorToolRef.current.style.backgroundColor = "#f0f0f0";
        bgToolRef.current.style.backgroundColor = "#f0f0f0";
    }

    async function switchTool(tool) {
        console.log(`Switching to tool: ${tool}`);
        if (tool === "text" && textToolActive.current) {
            console.log("Deactivating text tool");
            toggleTextTool();
            return;
        }
        if (tool === "clear" && clearToolActive.current) {
            console.log("Deactivating clear tool");
            toggleClearTool();
            return;
        }
        if (tool === "charColor" && charColorToolActive.current) {
            console.log("Deactivating char color tool");
            toggleCharColorTool();
            return;
        }
        if (tool === "bg" && bgToolActive.current) {
            console.log("Deactivating bg tool");
            toggleBgTool();
            return;
        }
        if (isAnyToolActive()) {
            console.log("Deactivating all tools before switching");
            await deactivateAllTools();
        }
        if (tool === "text") {
            toggleTextTool();
        } else if (tool === "clear") {
            console.log("toggleClearTool called");
            toggleClearTool();
        } else if (tool === "charColor") {
            toggleCharColorTool();
        } else if (tool === "bg") {
            toggleBgTool();
        }
    }

    function changePageNumber(event) {
        const pageInput = event.target;
        if (pageInput.value === "") {
            return;
        }
        if (pageInput.value < 1 || pageInput.value > 100000) {
            return;
        }
        //deactivate all tools to prevent random issues
        deactivateAllTools();
        const newPageNumber = parseInt(event.target.value);
        if (isNaN(newPageNumber) || newPageNumber < 1 || newPageNumber > 100000) {
            setErrMsg("Page number must be between 1 and 100k");
            return;
        }
        currentPage.current = newPageNumber;
        console.log(`Changing to page number: ${currentPage.current}`);
        clearCanvas();
        cellsArray.current = Array.from({ length: columns }, () => Array.from({ length: rows }, () => ({ char: "", bg: "" })));
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
    }

    function handleCharColorChange(event) {
        currentCharColor.current = event.target.value;
        console.log(`Character color changed to: ${currentCharColor.current}`);
    }

    function handleBgColorChange(event) {
        currentBgColor.current = event.target.value;
        console.log(`Background color changed to: ${currentBgColor.current}`);
    }

    function setErrMsg(message) {
        setErrorMessage(message);
        setTimeout(() => {
            setErrorMessage("");
        }, 5000);
    }

    function pressMobileKey(event, key) {
        if (event.isPrimary === false) {
            return;
        }
        event.preventDefault();
        window.dispatchEvent(new KeyboardEvent("keydown", { key }));
    }

    function toggleMobileKeyboard(event) {
        if (event.isPrimary === false) {
            return;
        }
        event.preventDefault();
        setMobileKeyboardOpen(open => !open);
    }

    return (
        <div className="telePageMain">
            <div className="movingHighlightDiv" ref={movingHighlightRef}></div>
            <div className="toolBarDiv">
                <div className="coinsDisplay">
                    <p><img src={coinImage} alt="Coin" /> {coins}</p>
                </div>
                <div className="toolDiv">
                    <div className="textWriteToolDiv">
                        <button className="toolButton" ref={textToolRef} onClick={() => switchTool("text")}>Text</button>
                    </div>
                    <div className="clearToolDiv">
                        <button className="toolButton" ref={clearToolRef} onClick={() => switchTool("clear")}>Clear</button>
                    </div>
                    <div className="charColorToolDiv">
                        <button className="toolButton" ref={charColorToolRef} onClick={() => switchTool("charColor")}>Character Color</button>
                    </div>
                    <div className="bgToolDiv">
                        <button className="toolButton" ref={bgToolRef} onClick={() => switchTool("bg")}>Background</button>
                    </div>
                </div>
            </div>
            <div className="colorPickerDiv">
                <label className="colorControl">Text <input type="color" id="charColorPicker" name="charColorPicker" value={currentCharColor.current} onChange={handleCharColorChange} /></label>
                <label className="colorControl">Background <input type="color" id="bgColorPicker" name="bgColorPicker" value={currentBgColor.current} onChange={handleBgColorChange}/></label>
            </div>
            <button className="mobileKeyboardButton" type="button" aria-label={mobileKeyboardOpen ? "Close keyboard" : "Open keyboard"} aria-expanded={mobileKeyboardOpen} aria-controls="mobileKeyboard" onPointerDown={toggleMobileKeyboard}>{mobileKeyboardOpen ? "×" : "⌨"}</button>
            {mobileKeyboardOpen && <div className="mobileKeyboardPanel" id="mobileKeyboard">
                {mobileKeyboardRows.map(row => <div className="mobileKeyboardRow mobileKeyboardLetterRow" key={row}>
                    {[...row].map(key => <button className="mobileKeyboardKey" type="button" key={key} onPointerDown={(event) => pressMobileKey(event, key)}>{key}</button>)}
                </div>)}
                <div className="mobileKeyboardRow mobileKeyboardActions">
                    <button className="mobileKeyboardKey mobileKeyboardSpace" type="button" onPointerDown={(event) => pressMobileKey(event, " ")}>Space</button>
                    <button className="mobileKeyboardKey" type="button" aria-label="Backspace" onPointerDown={(event) => pressMobileKey(event, "Backspace")}>⌫</button>
                    <button className="mobileKeyboardKey" type="button" aria-label="Enter" onPointerDown={(event) => pressMobileKey(event, "Enter")}>↵</button>
                </div>
            </div>}
            <div className="canvasDiv" style={{ '--tv-left': `${canvasHeight.current * 540 / 2790}px`, '--tv-right': `${canvasHeight.current * 1080 / 2790}px`, '--tv-left-width': `${canvasHeight.current * 1170 / 2790}px`, '--tv-right-width': `${canvasHeight.current * 1710 / 2790}px`, '--tv-center': `${canvasHeight.current * 270 / 2790}px`, '--tv-left-image': `url(${tvLeftImage})`, '--tv-middle-image': `url(${tvMiddleImage})`, '--tv-right-image': `url(${tvRightImage})`, transform: window.innerWidth < 700 ? 'none' : `translateX(${-canvasHeight.current * 270 / 2790}px)` }}>
                <div className="pageNumberDiv">
                    <input type="number" id="pageNumberInput" name="pageNumberInput" min="1" max="100000" defaultValue={currentPage.current} onChange={changePageNumber} />
                </div>
                <canvas className="teleCanvas" width={canvasWidth.current} height={canvasHeight.current} ref={canvasRef}></canvas>
                <div className="errorDiv" role="status">{errorMessage}</div>
            </div>
        </div>
    );
}

export default TelePage;
