import React from "react";
import "./TelePage.css";

function TelePage() {
    const rows = 24;
    const columns = 40;
    let canvasHeight = rows * (window.innerHeight / 100);
    let canvasWidth = columns * (window.innerWidth / 100);

    if (window.innerWidth < 700) {
        canvasWidth = (window.innerWidth / 100) * 95;
        canvasHeight = canvasWidth / columns * rows * 1.3;
    }

    return (
        <div className="telePageMain">
            <div className="canvasDiv">
                <canvas className="teleCanvas" width={canvasWidth} height={canvasHeight}></canvas>
            </div>
        </div>
    );
}

export default TelePage