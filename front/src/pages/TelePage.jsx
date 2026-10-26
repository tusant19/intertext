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